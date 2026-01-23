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
      
      const CARD_WIDTH = 320;
      const CARD_HEIGHT_EST = 380; // Average height for spacing
      const GAP = 60; 
      const COLS = 5;
      
      const BLOCK_WIDTH = COLS * (CARD_WIDTH + GAP);
      
      let maxRowHeight = 0;
      let colIndex = 0;
      let rowIndex = 0;

      const positioned = items.map((item: any, idx: number) => {
        // Calculate position based on a simple grid
        const x = colIndex * (CARD_WIDTH + GAP);
        const y = rowIndex * (CARD_HEIGHT_EST + GAP);
        
        // Update grid indices
        colIndex++;
        if (colIndex >= COLS) {
          colIndex = 0;
          rowIndex++;
        }
        
        maxRowHeight = Math.max(maxRowHeight, y + CARD_HEIGHT_EST);

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
          // Center the block around (0, 0)
          x: x - BLOCK_WIDTH / 2 + CARD_WIDTH / 2,
          y: y - maxRowHeight / 2,
        };
      });

      return {
        items: positioned as Article[],
        dimensions: { 
          width: BLOCK_WIDTH, 
          height: maxRowHeight + GAP 
        }
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}