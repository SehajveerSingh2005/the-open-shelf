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

      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        source: item.source,
        readingTime: item.reading_time || '5 min read',
        excerpt: item.excerpt,
        content: item.content,
        publishedAt: item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recently',
        url: item.url,
        x: item.x,
        y: item.y,
      })) as Article[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}