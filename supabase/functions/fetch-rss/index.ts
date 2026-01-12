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
      ['enclosure', 'enclosure']
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
    return item.enclosure.url;
  }
  // 3. Parse HTML content for first img tag (Critical for Substack/Marginalian)
  const content = item.contentEncoded || item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) {
    // Basic cleanup of the URL
    return imgMatch[1].split('?')[0];
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

    const { data: existing } = await supabaseClient.from('articles').select('url');
    const existingUrls = new Set((existing || []).map(a => a.url));
    
    const newItems = feed.items.filter(item => !existingUrls.has(item.link || ''));
    
    const articles = newItems.slice(0, 15).map((item) => {
      const content = item.contentEncoded || item.content || item.description || '';
      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled',
        author: item.creator || item.author || feed.title || 'Unknown',
        source: feed.title || 'Source',
        url: item.link,
        content,
        excerpt: (item.contentSnippet || item.description || '').substring(0, 300) + '...',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.ceil(content.split(' ').length / 225)} min read`,
        image_url: extractImageUrl(item),
        x: Math.floor(Math.random() * 4000) - 2000,
        y: Math.floor(Math.random() * 4000) - 2000
      };
    });

    if (articles.length > 0) {
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