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
      const COL_WIDTH = 350; // Tighter width
      const GAP = 24; // Smaller gap for "interlocked" look
      const RADIUS = 1400; // Smaller, denser circle
      
      // Calculate how many columns fit in our circle
      const NUM_COLS = Math.floor((RADIUS * 2) / COL_WIDTH);
      
      // Initialize column heights and start Y positions
      const colHeights = new Array(NUM_COLS).fill(0);
      const colStarts = new Array(NUM_COLS).fill(0).map((_, i) => {
        const x = (i - (NUM_COLS - 1) / 2) * COL_WIDTH;
        // Circle formula: y = sqrt(R^2 - x^2)
        // This gives us the top arc of the circle
        const halfHeight = Math.sqrt(Math.max(0, Math.pow(RADIUS, 2) - Math.pow(x, 2)));
        return -halfHeight;
      });

      return items.map((item: any, index: number) => {
        // Balance columns by finding the one with the least height added so far
        // but weight it by the starting offset to keep the circular shape
        let colIndex = 0;
        let minBottom = Infinity;
        
        for (let i = 0; i < NUM_COLS; i++) {
          const bottom = colStarts[i] + colHeights[i];
          if (bottom < minBottom) {
            minBottom = bottom;
            colIndex = i;
          }
        }
        
        const x = (colIndex - (NUM_COLS - 1) / 2) * COL_WIDTH;
        const y = colStarts[colIndex] + colHeights[colIndex];
        
        // Estimated height based on content length + padding
        const textLength = (item.excerpt || '').length + (item.title || '').length;
        const estimatedHeight = 180 + Math.min(textLength / 1.5, 250);
        
        colHeights[colIndex] += estimatedHeight + GAP;

        return {
          id: item.id,
          title: item.title,
          author: item.author,
          source: item.source,
          readingTime: item.reading_time || '5 min read',
          excerpt: item.excerpt,
          content: item.content,
          publishedAt: item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recently',
          url: item.url,
          x: x,
          y: y,
        };
      }) as Article[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}