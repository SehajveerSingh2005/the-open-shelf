import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types/article';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          feeds:feeds!articles_feed_id_fkey (
            is_hidden
          )
        `)
        .order('published_at', { ascending: false });

      if (error) throw error;

      const items = (data || []).filter(item => !item.feeds?.is_hidden);
      
      const COL_WIDTH = 380; 
      const GAP = 60; 
      const NUM_COLS = 5; // Wider base block
      const BLOCK_WIDTH = NUM_COLS * COL_WIDTH;
      
      // Use a seedable pseudo-random for layout consistency but visual variety
      const colHeights = new Array(NUM_COLS).fill(0).map((_, i) => (i % 2 === 0 ? 0 : 40));

      const positioned = items.map((item: any, idx: number) => {
        const colIndex = colHeights.indexOf(Math.min(...colHeights));
        
        // Add random horizontal jitter to break the vertical lines
        const jitterX = (Math.sin(idx * 1.5) * 30);
        const x = (colIndex * COL_WIDTH) - (BLOCK_WIDTH / 2) + (COL_WIDTH / 2) + jitterX;
        
        // Vertical shift based on index to create more gaps
        const y = colHeights[colIndex] + (Math.cos(idx * 0.8) * 20);
        
        const hasImage = !!item.image_url;
        // Vary the heights more aggressively for a better masonry effect
        const baseHeight = hasImage ? 380 : 260;
        const variableHeight = (Math.abs(Math.sin(idx)) * 120);
        const estimatedHeight = baseHeight + variableHeight;
        
        colHeights[colIndex] += estimatedHeight + GAP;

        return {
          id: item.id,
          title: item.title,
          author: item.author,
          source: item.source,
          readingTime: item.reading_time || '5 min read',
          excerpt: item.excerpt,
          content: item.content,
          imageUrl: item.image_url,
          publishedAt: item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recently',
          url: item.url,
          x: x,
          y: y,
        };
      });

      return {
        items: positioned as Article[],
        dimensions: { 
          width: BLOCK_WIDTH, 
          height: Math.max(...colHeights) 
        }
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}