import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types/article';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      // Fetch articles with their associated feed visibility
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          feeds:feeds!articles_feed_id_fkey (
            is_hidden
          )
        `)
        .order('published_at', { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        throw error;
      }

      // Filter out articles from hidden feeds manually
      const items = (data || []).filter(item => !item.feeds?.is_hidden);
      
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
        const estimatedHeight = (hasImage ? 176 : 0) + 240; // Base card height
        
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
    retry: 1,
  });
}