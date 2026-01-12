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
      const COL_WIDTH = 400;
      const GAP = 40;
      
      // We want to fit articles into a fixed block size for tiling
      // Let's aim for 4 columns
      const NUM_COLS = 4;
      const BLOCK_WIDTH = NUM_COLS * COL_WIDTH;
      const colHeights = new Array(NUM_COLS).fill(0);

      const positioned = items.map((item: any) => {
        // Find shortest column
        const colIndex = colHeights.indexOf(Math.min(...colHeights));
        
        const x = (colIndex * COL_WIDTH) - (BLOCK_WIDTH / 2) + (COL_WIDTH / 2);
        const y = colHeights[colIndex];
        
        // Dynamic height estimation
        const hasImage = !!item.image_url;
        const textLength = (item.excerpt || '').length + (item.title || '').length;
        const estimatedHeight = (hasImage ? 250 : 0) + 180 + Math.min(textLength / 1.5, 250);
        
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

      // Calculate the final bounding box of this block
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