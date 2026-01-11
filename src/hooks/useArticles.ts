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

      const COL_WIDTH = 400;
      const ROW_HEIGHT = 320;
      const COLS = 5;

      return (data || []).map((item: any, index: number) => {
        // Arrange in a grid starting from center
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        
        // Center the grid by offsetting based on total columns/rows
        const xOffset = (col - (COLS - 1) / 2) * COL_WIDTH;
        const yOffset = (row - 1) * ROW_HEIGHT;

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
          x: xOffset,
          y: yOffset,
        };
      }) as Article[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}