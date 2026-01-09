import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Parser from 'https://esm.sh/rss-parser@3.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const parser = new Parser();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { feedUrl } = await req.json()
    if (!feedUrl) throw new Error('feedUrl is required');

    console.log(`Fetching RSS: ${feedUrl}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the XML manually with a User-Agent to avoid being blocked
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
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
      .filter(item => item.link)
      .map(item => {
        let excerpt = item.contentSnippet || '';
        if (excerpt.length > 250) excerpt = excerpt.substring(0, 247) + '...';

        return {
          feed_id: feedData.id,
          title: item.title || 'Untitled Article',
          author: item.creator || item.author || feed.title || 'Unknown Author',
          source: feed.title || 'Unknown Source',
          url: item.link,
          content: item.content || item.contentSnippet || '',
          excerpt: excerpt,
          published_at: item.isoDate || new Date().toISOString(),
          reading_time: '5 min read',
          x: Math.floor(Math.random() * 1500),
          y: Math.floor(Math.random() * 1000)
        };
      });

    if (articles.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('articles')
        .upsert(articles, { onConflict: 'url' });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), {
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