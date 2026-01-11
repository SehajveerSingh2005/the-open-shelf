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
      ['media:content', 'mediaContent']
    ],
  }
});

serve(async (req) => {
  // Handle CORS preflight requests
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
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    console.log("[fetch-rss] Successfully parsed feed:", feed.title);
    
    // Upsert the feed and get its ID
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled' }, { onConflict: 'url' })
      .select('id')
      .single();

    if (feedError) {
      console.error("[fetch-rss] Feed upsert error:", feedError);
      throw feedError;
    }

    const { data: existing } = await supabaseClient.from('articles').select('url');
    const existingUrls = new Set((existing || []).map(a => a.url));
    
    // Filtering logic: exclude duplicates and video content
    const newItems = feed.items.filter(item => {
      const url = item.link || '';
      const isAlreadySaved = existingUrls.has(url);
      const isVideo = url.toLowerCase().includes('/video/') || 
                      item.title?.toLowerCase().includes('video:') ||
                      item.categories?.some(c => c.toLowerCase().includes('video'));
      
      return !isAlreadySaved && !isVideo;
    });
    
    console.log(`[fetch-rss] Found ${newItems.length} new articles to process`);

    const articles = newItems.slice(0, 20).map((item) => {
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
        x: Math.floor(Math.random() * 2000) - 1000, // Randomish start for layout
        y: Math.floor(Math.random() * 2000) - 1000
      };
    });

    if (articles.length > 0) {
      const { error: insertError } = await supabaseClient.from('articles').upsert(articles, { onConflict: 'url' });
      if (insertError) {
        console.error("[fetch-rss] Article insert error:", insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('[fetch-rss] Execution error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})