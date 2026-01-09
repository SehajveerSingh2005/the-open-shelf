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
    if (!feedUrl) throw new Error('No feed URL provided');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

    const xml = await response.text();
    let feed;
    try {
      feed = await parser.parseString(xml);
    } catch (parseErr) {
      throw new Error(`Failed to parse XML: ${parseErr.message}`);
    }
    
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled Feed' }, { onConflict: 'url' })
      .select().single();

    if (feedError) throw feedError;

    // Get count for positioning
    const { count } = await supabaseClient.from('articles').select('*', { count: 'exact', head: true });
    const startIdx = count || 0;

    const articles = feed.items.filter(item => item.link).map((item, index) => {
      // Robust content extraction for Substacks and Aeon
      const fullContent = item.contentEncoded || item.content || item.description || '';
      
      // Improve excerpt logic
      let excerpt = item.contentSnippet || '';
      if (!excerpt && fullContent) {
        excerpt = fullContent.replace(/<[^>]*>/g, '').substring(0, 250).trim() + '...';
      }

      // Strict grid layout to prevent overlap
      const globalIndex = startIdx + index;
      const col = globalIndex % 4;
      const row = Math.floor(globalIndex / 4);
      
      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled Article',
        author: item.creator || item.author || feed.title || 'Unknown Author',
        source: feed.title || 'Unknown Source',
        url: item.link,
        content: fullContent,
        excerpt: excerpt,
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: fullContent.length > 1000 ? `${Math.ceil(fullContent.split(' ').length / 225)} min read` : '4 min read',
        x: (col * 450) - 700,
        y: (row * 500) - 200
      };
    });

    if (articles.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from('articles')
        .upsert(articles, { onConflict: 'url' });
      
      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({ success: true, count: articles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RSS Fetcher Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})