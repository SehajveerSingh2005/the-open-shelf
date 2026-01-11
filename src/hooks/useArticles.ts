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

      const COL_WIDTH = 360;
      const NUM_COLS = 16;
      const RADIUS = 2000; // The bounding radius for the circular cluster
      
      // Initialize column heights and starting Y positions to form a circle
      const colHeights = new Array(NUM_COLS).fill(0);
      const colStarts = new Array(NUM_COLS).fill(0).map((_, i) => {
        const x = (i - (NUM_COLS - 1) / 2) * COL_WIDTH;
        // Circle equation: y = sqrt(R^2 - x^2)
        // We start the column at the "top" of the circle
        const offset = Math.sqrt(Math.max(0, Math.pow(RADIUS, 2) - Math.pow(x, 2)));
        return -offset / 2;
      });

      return (data || []).map((item: any, index: number) => {
        // Find the column that currently has the lowest bottom edge (masonry)
        // but within a "natural" flow
        const colIndex = index % NUM_COLS;
        
        const x = (colIndex - (NUM_COLS - 1) / 2) * COL_WIDTH;
        
        // Randomize height slightly to simulate varying content length impact on layout
        const estimatedHeight = 280 + (Math.random() * 100);
        const y = colStarts[colIndex] + colHeights[colIndex];
        
        // Update height for next item in this column
        colHeights[colIndex] += estimatedHeight + 40; // 40px gap

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