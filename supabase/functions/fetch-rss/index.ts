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

    // Use a deterministic grid based on the count of existing articles to prevent overlap
    const { count: existingCount } = await supabaseClient
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const startIdx = existingCount || 0;

    const articles = feed.items.filter(item => item.link).map((item, index) => {
      const content = item.contentEncoded || item.content || item.description || '';
      
      let excerpt = item.contentSnippet || '';
      if (excerpt.length > 250) excerpt = excerpt.substring(0, 247) + '...';

      // Structured grid layout: 400px wide, 500px tall cells
      const globalIndex = startIdx + index;
      const cols = 5;
      const col = globalIndex % cols;
      const row = Math.floor(globalIndex / cols);
      
      // Center the grid around 0,0
      const x = (col - (cols / 2)) * 350;
      const y = (row - 5) * 450;
      
      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled Article',
        author: item.creator || item.author || feed.title || 'Unknown Author',
        source: feed.title || 'Unknown Source',
        url: item.link,
        content: content,
        excerpt: excerpt,
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: content.length > 500 ? `${Math.ceil(content.split(' ').length / 250)} min read` : '4 min read',
        x: x + (Math.random() * 40 - 20), // Subtle jitter
        y: y + (Math.random() * 40 - 20)
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