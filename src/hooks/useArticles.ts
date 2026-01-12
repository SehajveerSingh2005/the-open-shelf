import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Article } from '@/types/article';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;

      const items = data || [];
      const COL_WIDTH = 360; 
      const GAP = 40; 
      
      const NUM_COLS = 4;
      const BLOCK_WIDTH = NUM_COLS * COL_WIDTH;
      const colHeights = new Array(NUM_COLS).fill(0);

      const positioned = items.map((item: any) => {
        const colIndex = colHeights.indexOf(Math.min(...colHeights));
        
        const x = (colIndex * COL_WIDTH) - (BLOCK_WIDTH / 2) + (COL_WIDTH / 2);
        const y = colHeights[colIndex];
        
        const hasImage = !!item.image_url;
        
        // Fixed height estimation based on exact CSS values:
        // Image: 176px
        // Padding: 48px (top + bottom)
        // Header: ~20px
        // Title (2 lines max): 48px
        // Excerpt (3 lines max): 60px
        // Footer: ~20px
        // Space-y-4 gaps: ~40px
        const maxContentHeight = 240; 
        const estimatedHeight = (hasImage ? 176 : 0) + maxContentHeight;
        
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

      const blockHeight = Math.max(...colHeights);

      return {
        items: positioned as Article[],
        dimensions: { width: BLOCK_WIDTH, height: blockHeight }
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}