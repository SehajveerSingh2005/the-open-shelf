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
      const COL_WIDTH = 360; // Slightly wider for better spacing
      const GAP = 48; // Increased gap to prevent any visual crowding
      
      const NUM_COLS = 4;
      const BLOCK_WIDTH = NUM_COLS * COL_WIDTH;
      const colHeights = new Array(NUM_COLS).fill(0);

      const positioned = items.map((item: any) => {
        const colIndex = colHeights.indexOf(Math.min(...colHeights));
        
        const x = (colIndex * COL_WIDTH) - (BLOCK_WIDTH / 2) + (COL_WIDTH / 2);
        const y = colHeights[colIndex];
        
        const hasImage = !!item.image_url;
        const textLength = (item.excerpt || '').length;
        const titleLength = (item.title || '').length;
        
        // Very conservative height estimation to guarantee no overlaps
        // Base padding and metadata: 100px
        // Title: ~30px per line (max 3 lines assumed)
        // Excerpt: ~20px per line (max 4 lines assumed)
        // Image: 176px + border
        const titleHeight = Math.ceil(titleLength / 30) * 32;
        const excerptHeight = Math.ceil(textLength / 45) * 24;
        const imagePadding = hasImage ? 200 : 0;
        
        const estimatedHeight = 120 + titleHeight + excerptHeight + imagePadding;
        
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