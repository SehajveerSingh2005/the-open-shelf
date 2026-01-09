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
    ],
  }
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { feedUrl } = await req.json()
    if (!feedUrl) throw new Error('feedUrl is required');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled Feed' }, { onConflict: 'url' })
      .select().single();

    if (feedError) throw feedError;

    const articles = feed.items.filter(item => item.link).map((item, index) => {
      // Prioritize full content fields
      const content = item.contentEncoded || item.content || item.description || item.contentSnippet || '';
      
      let excerpt = item.contentSnippet || '';
      if (excerpt.length > 250) excerpt = excerpt.substring(0, 247) + '...';

      // Use a much larger coordinate system to avoid overlaps
      // We'll use a loose grid-like random offset
      const col = index % 5;
      const row = Math.floor(index / 5);
      
      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled Article',
        author: item.creator || item.author || feed.title || 'Unknown Author',
        source: feed.title || 'Unknown Source',
        url: item.link,
        content: content,
        excerpt: excerpt,
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: content.length > 500 ? `${Math.ceil(content.split(' ').length / 200)} min read` : '3 min read',
        // Creating a massive spread (10,000 x 10,000 pixels)
        x: (col * 800) + Math.floor(Math.random() * 400) - 2000,
        y: (row * 600) + Math.floor(Math.random() * 300) - 2000
      };
    });

    if (articles.length > 0) {
      await supabaseClient.from('articles').upsert(articles, { onConflict: 'url' });
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})