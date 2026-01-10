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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { feedUrl } = await req.json();
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const response = await fetch(feedUrl);
    const xml = await response.text();
    const feed = await parser.parseString(xml);
    
    await supabaseClient
      .from('feeds')
      .upsert({ url: feedUrl, title: feed.title || 'Untitled' }, { onConflict: 'url' });

    // Fetch existing articles to find current column heights for masonry packing
    const { data: existing } = await supabaseClient.from('articles').select('url, x, y, excerpt');
    const existingUrls = new Set((existing || []).map(a => a.url));
    
    // Initial column heights based on existing layout
    const colHeights = [0, 0, 0, 0, 0];
    const cardWidth = 340;
    const cardGap = 24;

    if (existing && existing.length > 0) {
      existing.forEach(art => {
        const colIdx = Math.round(art.x / (cardWidth + cardGap)) + 2;
        if (colIdx >= 0 && colIdx < 5) {
          const estHeight = 240 + (art.excerpt?.length || 0) * 0.4;
          const bottom = art.y + 500 + (estHeight > 500 ? 500 : estHeight) + cardGap;
          if (bottom > colHeights[colIdx]) colHeights[colIdx] = bottom;
        }
      });
    }

    const newItems = feed.items.filter(item => !existingUrls.has(item.link || ''));
    
    const articles = newItems.slice(0, 10).map((item) => {
      const content = item.contentEncoded || item.content || item.description || '';
      
      // Find shortest column
      let minH = colHeights[0];
      let colIdx = 0;
      for (let i = 1; i < 5; i++) {
        if (colHeights[i] < minH) {
          minH = colHeights[i];
          colIdx = i;
        }
      }

      const x = (colIdx - 2) * (cardWidth + cardGap);
      const y = minH - 500;
      
      const estHeight = 240 + (item.contentSnippet || '').length * 0.4;
      colHeights[colIdx] += (estHeight > 500 ? 500 : estHeight) + cardGap;

      return {
        title: item.title || 'Untitled',
        author: item.creator || item.author || feed.title || 'Unknown',
        source: feed.title || 'Source',
        url: item.link,
        content,
        excerpt: (item.contentSnippet || '').substring(0, 300) + '...',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.ceil(content.split(' ').length / 225)} min read`,
        x,
        y
      };
    });

    if (articles.length > 0) await supabaseClient.from('articles').upsert(articles, { onConflict: 'url' });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})