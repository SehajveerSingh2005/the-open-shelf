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
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  if (item.enclosure && item.enclosure.url && (item.enclosure.type?.startsWith('image/') || item.enclosure.url.match(/\.(jpg|jpeg|png|webp|gif|svg)/i))) return item.enclosure.url;
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;
  
  const content = item.contentEncoded || item.content || item.description || '';
  const imgRegex = /<img[^>]+(?:src|data-src|data-full-url|data-original-src)="([^">]+)"/i;
  const match = content.match(imgRegex);
  return match && match[1] ? match[1] : null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { feedUrl } = await req.json();
    console.log("[fetch-rss] Fetching:", feedUrl);

    // Get Auth Context from request headers
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Create client with service role to bypass RLS and get user ID from JWT if needed
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader?.replace('Bearer ', '') ?? '');
    if (!user) throw new Error("Unauthorized");

    const response = await fetch(feedUrl);
    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ 
        url: feedUrl, 
        title: feed.title || 'Untitled', 
        user_id: user.id 
      }, { onConflict: 'url,user_id' })
      .select('id')
      .single();

    if (feedError) throw feedError;

    const articles = feed.items.slice(0, 15).map((item) => {
      const content = item.contentEncoded || item.content || item.description || '';
      return {
        feed_id: feedData.id,
        user_id: user.id,
        title: item.title || 'Untitled',
        author: item.creator || item.author || feed.title || 'Unknown',
        source: feed.title || 'Source',
        url: item.link,
        content,
        excerpt: (item.contentSnippet || item.description || '').substring(0, 300).replace(/<[^>]*>?/gm, '') + '...',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.ceil(content.split(' ').length / 225)} min read`,
        image_url: extractImageUrl(item),
        x: Math.floor(Math.random() * 4000) - 2000,
        y: Math.floor(Math.random() * 4000) - 2000
      };
    });

    if (articles.length > 0) {
      const { error: insertError } = await supabaseClient.from('articles').upsert(articles, { onConflict: 'url,user_id' });
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("[fetch-rss] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})