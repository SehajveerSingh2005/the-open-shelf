import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types/article';

// ... (imports)
export function useArticles() {
  return useInfiniteQuery({
    queryKey: ['articles'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { items: [] };

      // 1. Get feeds (only if page 0, but we need urls every time. optimizing to fetch once? 
      // React Query caches this queryFn, so fetching feeds every time is okay for now or we can cache feeds separately.
      // For simplicity/robustness, we fetch feeds every time. It's fast.)
      const { data: feeds } = await supabase
        .from('feeds')
        .select('url')
        .eq('user_id', user.id)
        .eq('is_hidden', false);

      if (!feeds || feeds.length === 0) {
        return { items: [] };
      }

      const feedUrls = feeds.map(f => f.url);

      // Dynamic page size: 
      // Initial load (page 0): Get 200 items to fill the shelf.
      // Subsequent loads: Get 50 items for speed.
      // If fewer sources (<5), increase initial load to 500.
      let pageSize = pageParam === 0 ? 200 : 50;
      if (feedUrls.length < 5 && pageParam === 0) pageSize = 500;

      // Calculate range
      const from = pageParam;
      const to = from + pageSize - 1;

      // 2. Fetch global articles matching those feed URLs
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .in('feed_url', feedUrls)
        .order('published_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return { items: articles || [] };
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page is empty, we are done.
      if (lastPage.items.length === 0) return undefined;
      // Next offset is the total number of items fetched so far
      return allPages.reduce((total, page) => total + page.items.length, 0);
    },
    select: (data) => {
      // Seeded shuffle function for consistent randomization
      const seededShuffle = <T,>(array: T[], seed: number): T[] => {
        const shuffled = [...array];
        let currentSeed = seed;

        // Simple seeded random number generator
        const seededRandom = () => {
          currentSeed = (currentSeed * 9301 + 49297) % 233280;
          return currentSeed / 233280;
        };

        // Fisher-Yates shuffle with seeded random
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
      };

      // Flatten and stable shuffle
      const allItems = data.pages.flatMap((page, pageIdx) =>
        seededShuffle(page.items, 42 + pageIdx)
      );

      // Spiral Layout
      // Theta increment: Golden Angle = PI * (3 - sqrt(5)) approx 2.39996
      const thetaIncrement = Math.PI * (3 - Math.sqrt(5));
      const spread = 300; // Tighter packing (was 450)

      const positioned = allItems.map((item: any, idx) => {
        // Spiral equations
        // r = c * sqrt(n)
        // theta = n * increment
        const r = spread * Math.sqrt(idx);
        const theta = idx * thetaIncrement;

        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

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

      // Calculate new boundary
      const maxRadius = positioned.length > 0
        ? Math.sqrt(Math.pow(positioned[positioned.length - 1].x, 2) + Math.pow(positioned[positioned.length - 1].y, 2))
        : 4000;

      const dim = Math.max(4000, maxRadius * 2 + 1000);

      return {
        items: positioned as Article[],
        dimensions: {
          width: dim,
          height: dim
        }
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}