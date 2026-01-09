import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Parser from 'https://esm.sh/rss-parser@3.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const parser = new Parser({
  customFields: {
    item: [['content:encoded', 'contentEncoded'], ['description', 'description']],
  }
});

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
      // Aeon stores article content in several potential containers
      const selectors = [
        /<div class="article__body[^"]*">([\s\S]*?)<\/div>\s*<div class="article__footer/i,
        /<div class="body-content[^"]*">([\s\S]*?)<\/div>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div class="article-body">([\s\S]*?)<\/div>/i
      ];

      for (const selector of selectors) {
        const match = html.match(selector);
        if (match && match[1]) {
          // Remove ads and sidebars within the match if possible
          return match[1].replace(/<div class="ad-container">[\s\S]*?<\/div>/gi, '').trim();
        }
      }
    }
    
    if (url.includes('substack.com')) {
      const substackMatch = html.match(/<div class="available-content">([\s\S]*?)<\/div>/i) || 
                           html.match(/<div class="body-content">([\s\S]*?)<\/div>/i);
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

    // Deep-fetch only the latest 5 to keep the function fast
    const articles = await Promise.all(feed.items.slice(0, 5).map(async (item, index) => {
      let fullContent = item.contentEncoded || item.content || item.description || '';
      
      const deepContent = await fetchFullContent(item.link || '', feed.title || '');
      if (deepContent) fullContent = deepContent;
      
      let excerpt = item.contentSnippet || '';
      if (!excerpt && fullContent) {
        excerpt = fullContent.replace(/<[^>]*>/g, '').substring(0, 300).trim() + '...';
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
        x: (col * 400) - 600,
        y: (row * 550) - 300
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