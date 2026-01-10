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

      return (data || []).map((item: any, index: number) => {
        // Calculate spiral positions dynamically on the client
        // This makes the layout 'live' and responsive to code changes
        const n = index;
        const angle = n * 2.39996; // Golden Angle
        const radius = Math.sqrt(n + 1);
        
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
          // Tightened multipliers for better visibility
          x: 320 * radius * Math.cos(angle),
          y: 280 * radius * Math.sin(angle),
        };
      }) as Article[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}