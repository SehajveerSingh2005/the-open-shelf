import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Parser from 'https://esm.sh/rss-parser@3.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const parser = new Parser({
  customFields: {
    item: [['content:encoded', 'contentEncoded']],
  }
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { feedUrl } = await req.json()
    console.log(`Fetching RSS: ${feedUrl}`);
    
    if (!feedUrl) throw new Error('feedUrl is required');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch and parse the RSS feed
    const feed = await parser.parseURL(feedUrl);
    
    // 1. Get or create the feed record
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ 
        url: feedUrl, 
        title: feed.title || 'Untitled Feed' 
      }, { onConflict: 'url' })
      .select()
      .single();

    if (feedError) throw feedError;

    // 2. Prepare articles for upsert
    const articles = feed.items
      .filter(item => item.link) // Must have a link to be unique
      .map(item => {
        // Clean up the excerpt
        let excerpt = item.contentSnippet || '';
        if (excerpt.length > 250) excerpt = excerpt.substring(0, 247) + '...';

        return {
          feed_id: feedData.id,
          title: item.title || 'Untitled Article',
          author: item.creator || item.author || feed.title || 'Unknown Author',
          source: feed.title || 'Unknown Source',
          url: item.link,
          content: item.contentEncoded || item.content || item.contentSnippet || '',
          excerpt: excerpt,
          published_at: item.isoDate || new Date().toISOString(),
          reading_time: '5 min read', // Placeholder for simplicity
          x: Math.floor(Math.random() * 2000), // Wider spread for canvas
          y: Math.floor(Math.random() * 2000)
        };
      });

    if (articles.length > 0) {
      console.log(`Upserting ${articles.length} articles from ${feed.title}`);
      const { error: insertError } = await supabaseClient
        .from('articles')
        .upsert(articles, { onConflict: 'url' });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      count: articles.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})