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

    if (sourceName.toLowerCase().includes('aeon') || url.includes('aeon.co')) {
      const patterns = [
        /<div class="article__body[^>]*>([\s\S]*?)<\/div>\s*<div class="article__footer/i,
        /<div class="body-content[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 1000) {
          return match[1]
            .replace(/<div class="ad-container">[\s\S]*?<\/div>/gi, '')
            .replace(/<aside[\s\S]*?<\/aside>/gi, '')
            .trim();
        }
      }
    }
    
    if (url.includes('substack.com')) {
      const patterns = [
        /<div class="available-content">([\s\S]*?)<\/div>/i,
        /<div class="body-content[^>]*>([\s\S]*?)<\/div>/i
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) return match[1].trim();
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { feedUrl } = await req.json();
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const response = await fetch(feedUrl);
    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
    const { data: feedData } = await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled' }, { onConflict: 'url' })
      .select().single();

    const { data: existing } = await supabaseClient.from('articles').select('url');
    const existingUrls = new Set((existing || []).map(a => a.url));
    const newItems = feed.items.filter(item => !existingUrls.has(item.link || ''));
    
    const { count: currentTotal } = await supabaseClient.from('articles').select('*', { count: 'exact', head: true });
    let baseIdx = currentTotal || 0;

    const articles = await Promise.all(newItems.slice(0, 10).map(async (item, index) => {
      let content = item.contentEncoded || item.content || item.description || '';
      if (content.length < 3000 && item.link) {
        const full = await fetchFullContent(item.link, feed.title || '');
        if (full) content = full;
      }
      
      const idx = baseIdx + index;
      const col = idx % 3;
      const row = Math.floor(idx / 3);

      return {
        feed_id: feedData.id,
        title: item.title || 'Untitled',
        author: item.creator || item.author || feed.title || 'Unknown',
        source: feed.title || 'Source',
        url: item.link,
        content,
        excerpt: (item.contentSnippet || '').substring(0, 300) + '...',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.ceil(content.split(' ').length / 225)} min read`,
        x: (col - 1) * 450 + (Math.random() * 40),
        y: (row) * 600 + (Math.random() * 40)
      };
    }));

    if (articles.length > 0) await supabaseClient.from('articles').upsert(articles, { onConflict: 'url' });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})