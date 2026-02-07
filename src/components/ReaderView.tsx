"use client";

import { useState, useEffect, useRef} from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, Moon, Sun, AlignCenter, AlignJustify, Heart, Share2, Quote, Settings, Minus, Plus } from 'lucide-react';
import { Article } from '@/types/article';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
    const defaults = { fontSize: 20, lineHeight: 1.75, fontType: 'sans' as FontType, layout: 'standard' as LayoutType };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
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

  // Optimize selection handling: Use mouseup/keyup to avoid re-renders during drag
  // This fixes the "laggy" feel and "rendering resets selection" bug.
  useEffect(() => {
    const handleSelectionEnd = () => {
      // Use RAF to ensure selection is final
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          setSelection(null);
          return;
        }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate position - ReaderView is fixed, so we use viewport coordinates directly
        // If the window itself doesn't scroll, window.scrollY is 0.
        // We use absolute positioning for the tooltip.
        setSelection({
          text: sel.toString().trim(),
          top: rect.top - 60, // Removed window.scrollY as ReaderView is fixed overlay
          left: rect.left + rect.width / 2
        });
      });
    };

    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('keyup', handleSelectionEnd);

    // Optional: Hide tooltip on scroll to prevent drifting
    const container = containerRef.current;
    const handleScroll = () => {
      if (selection) setSelection(null);
    };

    if (container) container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('keyup', handleSelectionEnd);
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [selection]); // Depend on selection to allow scroll-clearing logic to work properly? 
  // Actually, we don't need handleTextSelection as a dependency anymore since logic is inline or stable.
  // But wait, if I inline it, I need access to setSelection. 
  // 'selection' dependency is needed for handleScroll to know if it should clear (optimization).

  // NOTE: I removed the useCallback 'handleTextSelection' block entirely in favor of this effect
  // to clean up duplicated logic potential.

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
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        type: "tween",
        ease: [0.22, 1, 0.36, 1],
        duration: 0.5
      }}
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
            <PopoverTrigger asChild><Button variant="ghost" size="icon" className="text-gray-400"><Settings size={18} /></Button></PopoverTrigger>
            <PopoverContent className="w-64 p-5 rounded-none border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl">
              <div className="space-y-6">
                {/* Theme & Layout Combined Row for compactness */}
                <div className="flex justify-between items-start space-x-4">
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Theme</span>
                    <div className="flex border rounded-none p-0.5 w-fit">
                      <button onClick={() => setTheme('light')} className={cn("p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors", theme === 'light' ? 'bg-gray-100 dark:bg-gray-800' : '')}><Sun size={14} /></button>
                      <button onClick={() => setTheme('dark')} className={cn("p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors", theme === 'dark' ? 'bg-gray-100 dark:bg-gray-800' : '')}><Moon size={14} /></button>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Width</span>
                    <div className="flex border rounded-none p-0.5 w-fit">
                      {['narrow', 'standard', 'wide'].map((l) => (
                        <button
                          key={l}
                          onClick={() => setSettings({ ...settings, layout: l as any })}
                          className={cn(
                            "p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors relative group",
                            settings.layout === l ? 'bg-gray-100 dark:bg-gray-800' : ''
                          )}
                          title={l.charAt(0).toUpperCase() + l.slice(1)}
                        >
                          {l === 'narrow' && <AlignJustify size={14} className="rotate-90" />}
                          {l === 'standard' && <AlignCenter size={14} />}
                          {l === 'wide' && <AlignJustify size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Typography</span>

                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {['sans', 'serif', 'mono'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSettings({ ...settings, fontType: f as any })}
                        className={cn(
                          "text-xs py-1 px-2 border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
                          settings.fontType === f ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' : 'border-transparent'
                        )}
                      >
                        {f === 'sans' ? 'Sans' : f === 'serif' ? 'Serif' : 'Mono'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border rounded-none p-1">
                    <button
                      onClick={() => setSettings({ ...settings, fontSize: Math.max(14, settings.fontSize - 2) })}
                      className="p-1 px-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-500"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-mono w-8 text-center">{settings.fontSize}</span>
                    <button
                      onClick={() => setSettings({ ...settings, fontSize: Math.min(32, settings.fontSize + 2) })}
                      className="p-1 px-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-500"
                    >
                      <Plus size={14} />
                    </button>
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
            // Aggressive Image/Media handling: ensure no overflow is possible
            "[&_img]:!max-w-full [&_img]:!h-auto [&_img]:!rounded-md [&_img]:!my-6 [&_img]:!mx-auto [&_img]:object-contain",
            "[&_figure]:!max-w-full [&_figure]:!mx-auto",
            "[&_video]:!max-w-full [&_video]:!h-auto [&_video]:!rounded-md [&_video]:!mx-auto",
            // Iframe/Video handling
            "[&_iframe]:!max-w-full [&_iframe]:!w-full [&_iframe]:aspect-video [&_iframe]:!rounded-md [&_iframe]:!my-6",
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