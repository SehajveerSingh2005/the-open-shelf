import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types/article';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          feeds:feeds!articles_feed_id_fkey (
            is_hidden
          )
        `)
        .order('published_at', { ascending: false });

      if (error) throw error;

      const items = (data || []).filter(item => !item.feeds?.is_hidden);

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

      // Shuffle articles to mix sources randomly (using user ID or constant seed for consistency)
      const shuffledItems = seededShuffle(items, 42);

      // Masonry grid with balanced rows and columns for circular distribution
      const CARD_WIDTH = 380;
      const GAP = 60;

      // Use more balanced column count (closer to square) for better circular fill
      const NUM_COLS = Math.ceil(Math.sqrt(items.length * 1.2));
      const GRID_WIDTH = NUM_COLS * CARD_WIDTH;

      // Track column heights for masonry interlocking
      const colHeights: number[] = new Array(NUM_COLS).fill(0).map((_, i) => (i % 2 === 0 ? 0 : 40));

      const positioned = shuffledItems.map((item: any, idx: number) => {
        // Find shortest column for interlocking masonry pattern
        const minHeight = Math.min(...colHeights);
        const colIndex = colHeights.indexOf(minHeight);

        // Horizontal position with jitter
        const jitterX = (Math.sin(idx * 1.5) * 30);
        const x = (colIndex * CARD_WIDTH) - (GRID_WIDTH / 2) + (CARD_WIDTH / 2) + jitterX;

        // Vertical position from column height
        const y = colHeights[colIndex] + (Math.cos(idx * 0.8) * 20);

        // Variable card heights based on content
        const hasImage = !!item.image_url;
        const baseHeight = hasImage ? 380 : 260;
        const variableHeight = (Math.abs(Math.sin(idx)) * 120);
        const estimatedHeight = baseHeight + variableHeight;

        // Update column height for next card (creates interlocking)
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

      // Center the grid vertically
      const totalHeight = Math.max(...colHeights);
      const verticalOffset = totalHeight / 2;

      const centeredPositioned = positioned.map(item => ({
        ...item,
        y: item.y - verticalOffset
      }));

      // Apply circular boundary - filter out articles outside the circle
      const maxDimension = Math.max(GRID_WIDTH, totalHeight);
      const radius = maxDimension / 2;

      const circularFiltered = centeredPositioned.filter(item => {
        const distance = Math.sqrt(item.x * item.x + item.y * item.y);
        return distance <= radius;
      });

      return {
        items: circularFiltered as Article[],
        dimensions: {
          width: maxDimension,
          height: maxDimension
        }
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}