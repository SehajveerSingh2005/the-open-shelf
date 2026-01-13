import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Parser from 'https://esm.sh/rss-parser@3.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'], 
      ['description', 'description'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure'],
      ['media:thumbnail', 'mediaThumbnail']
    ],
  }
});

const extractImageUrl = (item: any): string | null => {
  // 1. Check media:content
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  // 2. Check enclosure
  if (item.enclosure && item.enclosure.url) {
    // Basic check to ensure it's likely an image (some enclosures are audio)
    if (item.enclosure.type?.startsWith('image/') || item.enclosure.url.match(/\.(jpg|jpeg|png|webp|gif|svg)/i)) {
      return item.enclosure.url;
    }
  }
  // 3. Check media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    return item.mediaThumbnail.$.url;
  }
  
  // 4. Parse HTML content for img tag - Enhanced for Substack and Ghost
  const content = item.contentEncoded || item.content || item.description || '';
  
  // Look for various src-like attributes used by different platforms and lazy loaders
  const imgRegex = /<img[^>]+(?:src|data-src|data-full-url|data-original-src)="([^">]+)"/i;
  const match = content.match(imgRegex);
  
  if (match && match[1]) {
    let url = match[1];
    // For Substack/Ghost, we don't want to strip the URL if it doesn't have a standard extension 
    // because they often use proxy/resizer URLs that are valid images.
    return url;
  }
  
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedUrl } = await req.json();
    console.log("[fetch-rss] Starting fetch for URL:", feedUrl);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const response = await fetch(feedUrl);
    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled' }, { onConflict: 'url' })
      .select('id')
      .single();

    if (feedError) throw feedError;

    // Process all items (limit to 15) to allow backfilling missing images
    const articles = feed.items.slice(0, 15).map((item) => {
      const content = item.contentEncoded || item.content || item.description || '';
      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled',
        author: item.creator || item.author || feed.title || 'Unknown',
        source: feed.title || 'Source',
        url: item.link,
        content,
        excerpt: (item.contentSnippet || item.description || '').substring(0, 300).replace(/<[^>]*>?/gm, '') + '...',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.ceil(content.split(' ').length / 225)} min read`,
        image_url: extractImageUrl(item),
        // Coordinates will only be used if the article is brand new (handled by DB default if not provided)
        x: Math.floor(Math.random() * 4000) - 2000,
        y: Math.floor(Math.random() * 4000) - 2000
      };
    });

    if (articles.length > 0) {
      // Upsert will update existing articles with newly found image URLs
      const { error: insertError } = await supabaseClient.from('articles').upsert(articles, { onConflict: 'url' });
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})