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

// Helper to extract the "real" content for known truncated sources like Aeon
async function fetchFullContent(url: string, source: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) return null;
    const html = await response.text();

    if (source.toLowerCase().includes('aeon')) {
      // Aeon stores article content in a specific div
      const articleMatch = html.match(/<div class="article__body[^"]*">([\s\S]*?)<\/div>\s*<div class="article__footer/i);
      if (articleMatch && articleMatch[1]) {
        return articleMatch[1].trim();
      }
      
      // Fallback for different Aeon templates
      const bodyMatch = html.match(/<div class="body-content[^"]*">([\s\S]*?)<\/div>/i);
      if (bodyMatch && bodyMatch[1]) return bodyMatch[1].trim();
    }
    
    if (url.includes('substack.com')) {
      // Substack usually has full content in RSS, but if it doesn't:
      const substackMatch = html.match(/<div class="available-content">([\s\S]*?)<\/div>/i);
      if (substackMatch && substackMatch[1]) return substackMatch[1].trim();
    }

    return null;
  } catch (e) {
    console.error(`Failed to deep-fetch ${url}:`, e);
    return null;
  }
}

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

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
    const { data: feedData, error: feedError } = await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled Feed' }, { onConflict: 'url' })
      .select().single();

    if (feedError) throw feedError;

    const { count } = await supabaseClient.from('articles').select('*', { count: 'exact', head: true });
    const startIdx = count || 0;

    // Process only the top 5 newest articles for deep-fetching to avoid timeouts
    const itemsToProcess = feed.items.slice(0, 8);

    const articles = await Promise.all(itemsToProcess.filter(item => item.link).map(async (item, index) => {
      let fullContent = item.contentEncoded || item.content || item.description || '';
      const isTeaser = fullContent.length < 1500; // Heuristic: short content is likely a teaser
      
      // If it's a teaser and it's Aeon or Substack, try to get the real body
      if (isTeaser && item.link) {
        const deepContent = await fetchFullContent(item.link, feed.title || '');
        if (deepContent) fullContent = deepContent;
      }
      
      let excerpt = item.contentSnippet || '';
      if (!excerpt && fullContent) {
        excerpt = fullContent.replace(/<[^>]*>/g, '').substring(0, 250).trim() + '...';
      }

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
        reading_time: `${Math.max(3, Math.ceil(fullContent.split(' ').length / 225))} min read`,
        x: (col * 450) - 700,
        y: (row * 500) - 200
      };
    }));

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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})