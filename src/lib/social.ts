import { supabase } from '@/integrations/supabase/client';

export const toggleLike = async (articleId: string, userId: string, isLiked: boolean) => {
  if (isLiked) {
    return await supabase.from('likes').delete().eq('article_id', articleId).eq('user_id', userId);
  } else {
    return await supabase.from('likes').insert({ article_id: articleId, user_id: userId });
  }
};

export const createRepost = async (articleId: string, userId: string, highlightText?: string, comment?: string) => {
  return await supabase.from('reposts').insert({
    article_id: articleId,
    user_id: userId,
    highlight_text: highlightText,
    comment: comment
  });
};

export const updateReadingProgress = async (articleId: string, userId: string, progress: number) => {
  return await supabase.from('reading_activity').upsert({
    article_id: articleId,
    user_id: userId,
    progress,
    last_read_at: new Error().toISOString() // This is a hack to get current time if not using raw SQL
  }, { onConflict: 'user_id,article_id' });
};