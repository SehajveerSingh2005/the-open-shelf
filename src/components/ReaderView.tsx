"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, ExternalLink, Type, Moon, Sun, AlignLeft, AlignCenter, AlignJustify, Heart, Share2, Quote, MessageSquare, Check } from 'lucide-react';
import { Article } from '@/types/article';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { saveScrollPosition, getScrollPosition } from '@/lib/scrollPositionDB';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toggleLike, createRepost, updateReadingProgress } from '@/lib/social';
import { showSuccess, showError } from '@/utils/toast';

interface ReaderViewProps {
  article: Article | null;
  onClose: () => void;
}

type FontType = 'serif' | 'sans' | 'mono';
type LayoutType = 'narrow' | 'standard' | 'wide';

const STORAGE_KEY = 'open-shelf-reader-settings';

const ReaderContent = ({ article, onClose }: { article: Article, onClose: () => void }) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [isReposting, setIsReposting] = useState(false);
  const [repostComment, setRepostComment] = useState('');

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        fontSize: 20,
        lineHeight: 1.75,
        fontType: 'sans' as FontType,
        layout: 'standard' as LayoutType
      };
    } catch {
      return { fontSize: 20, lineHeight: 1.75, fontType: 'sans', layout: 'standard' };
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const checkLike = async () => {
      if (!user) return;
      const { data } = await supabase.from('likes').select('id').eq('article_id', article.id).eq('user_id', user.id).single();
      setIsLiked(!!data);
    };
    checkLike();
  }, [article.id, user]);

  const handleLike = async () => {
    if (!user) return;
    const { error } = await toggleLike(article.id, user.id, isLiked);
    if (!error) setIsLiked(!isLiked);
  };

  const handleShare = () => {
    navigator.share?.({ title: article.title, url: window.location.href })
      .catch(() => {
        navigator.clipboard.writeText(window.location.href);
        showSuccess("Link copied to clipboard");
      });
  };

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelection({
      text: sel.toString().trim(),
      top: rect.top + window.scrollY - 60,
      left: rect.left + rect.width / 2
    });
  }, []);

  const handleRepost = async () => {
    if (!user || !selection) return;
    setIsReposting(true);
    const { error } = await createRepost(article.id, user.id, selection.text, repostComment);
    if (!error) {
      showSuccess("Thought shared to your shelf");
      setSelection(null);
      setRepostComment('');
    } else {
      showError("Could not share highlight");
    }
    setIsReposting(false);
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleTextSelection);
    return () => document.removeEventListener('selectionchange', handleTextSelection);
  }, [handleTextSelection]);

  // Reading progress tracking
  useEffect(() => {
    if (!containerRef.current || !user) return;
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest > 0.1) {
        updateReadingProgress(article.id, user.id, latest);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, article.id, user]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: '100vh' }}
      animate={{ y: 0 }}
      exit={{ y: '100vh' }}
      className={cn("fixed inset-0 z-50 overflow-y-auto", theme === 'light' ? 'bg-white text-gray-900' : 'bg-[#0a0a0a] text-gray-100')}
    >
      <div className={cn("fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 border-b", theme === 'light' ? 'bg-white/95 border-gray-50' : 'bg-[#0a0a0a]/95 border-gray-900')}>
        <motion.div className={cn("absolute bottom-0 left-0 right-0 h-[1.5px] origin-left", theme === 'light' ? 'bg-gray-900' : 'bg-gray-100')} style={{ scaleX }} />
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleLike} className={isLiked ? "text-red-500" : "text-gray-400"}>
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="text-gray-400">
            <Share2 size={18} />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Popover>
            <PopoverTrigger asChild><Button variant="ghost" size="icon" className="text-gray-400"><Type size={18} /></Button></PopoverTrigger>
            <PopoverContent className="w-64 p-5 rounded-none border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Theme</span>
                    <div className="flex border rounded-none p-0.5">
                      <button onClick={() => setTheme('light')} className={cn("p-1.5", theme === 'light' ? 'bg-gray-100' : '')}><Sun size={12} /></button>
                      <button onClick={() => setTheme('dark')} className={cn("p-1.5", theme === 'dark' ? 'bg-gray-800' : '')}><Moon size={12} /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Layout</span>
                    <div className="grid grid-cols-3 gap-1">
                      {['narrow', 'standard', 'wide'].map((l) => (
                        <Button key={l} variant={settings.layout === l ? 'secondary' : 'outline'} size="sm" className="h-7 text-[10px]" onClick={() => setSettings({...settings, layout: l})}>{l}</Button>
                      ))}
                    </div>
                  </div>
               </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400"><X size={20} /></Button>
        </div>
      </div>

      {/* Highlighting Toolbar */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ position: 'fixed', top: selection.top, left: selection.left, transform: 'translateX(-50%)' }}
            className="z-[60] bg-gray-950 text-white rounded-full px-4 py-2 flex items-center space-x-4 shadow-xl border border-white/10"
          >
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold hover:text-gray-300">
                  <Quote size={14} />
                  <span>Repost</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-none bg-gray-950 border-white/10 text-white">
                <div className="space-y-4">
                  <p className="text-sm font-serif italic text-gray-400 border-l border-white/20 pl-4">{selection.text}</p>
                  <textarea
                    placeholder="Add your thought..."
                    className="w-full bg-transparent border-b border-white/10 text-sm focus:outline-none focus:border-white/40 py-2 resize-none"
                    rows={3}
                    value={repostComment}
                    onChange={(e) => setRepostComment(e.target.value)}
                  />
                  <Button 
                    onClick={handleRepost} 
                    disabled={isReposting}
                    className="w-full bg-white text-black hover:bg-gray-200 rounded-none h-10 text-[10px] uppercase tracking-widest font-bold"
                  >
                    {isReposting ? "Sharing..." : "Post to Shelf"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>

      <article className={cn(
        settings.layout === 'narrow' ? 'max-w-2xl' : settings.layout === 'wide' ? 'max-w-5xl' : 'max-w-3xl',
        "mx-auto px-6 py-32"
      )}>
        <header className="mb-20 space-y-6">
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">{article.source} • {article.publishedAt}</p>
          <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.0] tracking-tight">{article.title}</h1>
          <div className="flex items-center space-x-4 text-xl font-serif italic text-gray-400 border-t pt-8">
            <span>by {article.author}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{article.readingTime}</span>
          </div>
        </header>

        <div
          ref={contentRef}
          className={cn(
            "prose prose-lg max-w-none transition-all duration-300",
            settings.fontType === 'serif' ? 'font-serif' : 'font-sans',
            theme === 'light' ? 'prose-gray' : 'prose-invert prose-gray'
          )}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </motion.div>
  );
};

const ReaderView = ({ article, onClose }: ReaderViewProps) => {
  return (
    <AnimatePresence mode="wait">
      {article && <ReaderContent key={article.id} article={article} onClose={onClose} />}
    </AnimatePresence>
  );
};

export default ReaderView;