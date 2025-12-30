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
    console.log(`Processing feed: ${feedUrl}`);
    
    if (!feedUrl) {
      throw new Error('feedUrl is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch and parse the RSS feed
    const feed = await parser.parseURL(feedUrl);
    console.log(`Successfully parsed: ${feed.title}`);
    
    // 1. Update/Insert the feed info
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ 
        url: feedUrl, 
        title: feed.title || 'Untitled Feed' 
      }, { onConflict: 'url' })
      .select()
      .single()

    if (feedError) {
      console.error('Feed upsert error:', feedError);
      throw feedError;
    }

    // 2. Map and filter articles (must have a URL/Link)
    const articles = feed.items
      .filter(item => item.link) // Ensure we have a URL for the unique constraint
      .map(item => ({
        feed_id: feedData.id,
        title: item.title || 'Untitled Article',
        author: item.creator || item.author || feed.title || 'Unknown Author',
        source: feed.title || 'Unknown Source',
        url: item.link,
        content: item.content || item.contentSnippet || '',
        excerpt: item.contentSnippet ? item.contentSnippet.substring(0, 200) + '...' : '',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: '5 min read',
        x: Math.floor(Math.random() * 800) + 100,
        y: Math.floor(Math.random() * 500) + 100
      }));

    if (articles.length > 0) {
      console.log(`Upserting ${articles.length} articles`);
      const { error: insertError } = await supabaseClient
        .from('articles')
        .upsert(articles, { onConflict: 'url' });

      if (insertError) {
        console.error('Articles upsert error:', insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ 
      message: `Successfully processed ${articles.length} articles from ${feed.title}`,
      feedId: feedData.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('RSS Fetch Error Detail:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})