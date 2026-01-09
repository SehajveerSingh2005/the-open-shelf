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

async function fetchFullContent(url: string, sourceName: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) return null;
    const html = await response.text();

    // Specific logic for Aeon
    if (sourceName.toLowerCase().includes('aeon') || url.includes('aeon.co')) {
      // Aeon usually puts content in article__body or similar
      const patterns = [
        /<div class="article__body[^>]*>([\s\S]*?)<\/div>\s*<div class="article__footer/i,
        /<div class="body-content[^>]*>([\s\S]*?)<\/div>/i,
        /<div class="article-body[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          // Clean up some common junk
          return match[1]
            .replace(/<div class="ad-container">[\s\S]*?<\/div>/gi, '')
            .replace(/<aside[\s\S]*?<\/aside>/gi, '')
            .trim();
        }
      }
    }
    
    // Logic for Substacks
    if (url.includes('substack.com')) {
      const substackPatterns = [
        /<div class="available-content">([\s\S]*?)<\/div>/i,
        /<div class="body-content[^>]*>([\s\S]*?)<\/div>/i,
        /<div class="post-content[^>]*>([\s\S]*?)<\/div>/i
      ];
      
      for (const pattern of substackPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) return match[1].trim();
      }
    }

    return null;
  } catch (e) {
    console.error(`Deep fetch error for ${url}:`, e);
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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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

    // Get current count to calculate initial placement
    const { count: existingCount } = await supabaseClient.from('articles').select('*', { count: 'exact', head: true });
    const startIdx = existingCount || 0;

    // Process top items with deep fetching
    const articles = await Promise.all(feed.items.slice(0, 6).map(async (item, index) => {
      let content = item.contentEncoded || item.content || item.description || '';
      
      // Try to get full content if current is likely a summary
      if (content.length < 2000 && item.link) {
        const fullBody = await fetchFullContent(item.link, feed.title || '');
        if (fullBody) content = fullBody;
      }
      
      let excerpt = item.contentSnippet || '';
      if (!excerpt && content) {
        excerpt = content.replace(/<[^>]*>/g, '').substring(0, 300).trim() + '...';
      }

      // Placement logic for the canvas
      const globalIndex = startIdx + index;
      const col = globalIndex % 4;
      const row = Math.floor(globalIndex / 4);
      
      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled Article',
        author: item.creator || item.author || feed.title || 'Unknown Author',
        source: feed.title || 'Unknown Source',
        url: item.link,
        content: content,
        excerpt: excerpt,
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.max(3, Math.ceil(content.split(' ').length / 225))} min read`,
        x: (col * 420) - 630, // Adjusted for spacing
        y: (row * 550) - 275
      };
    }));

    if (articles.length > 0) {
      await supabaseClient.from('articles').upsert(articles, { onConflict: 'url' });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})