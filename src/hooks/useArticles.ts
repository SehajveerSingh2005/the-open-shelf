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

      // Tightened dimensions for a denser feel
      const COL_WIDTH = 360; 
      const ROW_HEIGHT = 300;
      // Increased columns so it spreads out sideways
      const COLS = 12; 

      return (data || []).map((item: any, index: number) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        
        // Horizontal-first layout that centers the mass
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