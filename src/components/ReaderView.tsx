"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, Moon, Sun, AlignCenter, AlignJustify, Heart, Share2, Quote, Settings, Minus, Plus, ExternalLink, Layers } from 'lucide-react';
import { AddToStack } from '@/components/AddToStack';
import { Article } from '@/types/article';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  const [selection, setSelection] = useState<{ text: string; top: number; left: number; timestamp: number } | null>(null);
  const [isReposting, setIsReposting] = useState(false);
  const [repostComment, setRepostComment] = useState('');
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  const [settings, setSettings] = useState(() => {
    const defaults = { fontSize: 20, lineHeight: 1.75, fontType: 'sans' as FontType, layout: 'standard' as LayoutType, heroMode: false };
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleLike = async () => {
    if (!user) return;
    const { error } = await toggleLike(article.id, user.id, isLiked);
    if (!error) setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: `Read "${article.title}"`,
      url: article.url, // Share the original source URL for better compatibility
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Only fallback if it wasn't a user cancellation
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareData.url);
          showSuccess("Link copied to clipboard");
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      showSuccess("Link copied to clipboard");
    }
  };

  // Optimize selection handling: Use mouseup/keyup to avoid re-renders during drag
  // This fixes the "laggy" feel and "rendering resets selection" bug.
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Optimize selection handling: Use mouseup/keyup to avoid re-renders during drag
  // This fixes the "laggy" feel and "rendering resets selection" bug.
  // We utilize a ref for the popover state to start reading the fresh state immediately inside the listener
  const isPopoverOpenRef = useRef(false);
  useEffect(() => { isPopoverOpenRef.current = isPopoverOpen; }, [isPopoverOpen]);

  useEffect(() => {
    const handleSelectionEnd = () => {
      // Don't clear selection if we're interacting with the repost popover
      if (isPopoverOpenRef.current) return;

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
          left: rect.left + rect.width / 2,
          timestamp: Date.now()
        });
      });
    };

    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('keyup', handleSelectionEnd);

    // Optional: Hide tooltip on scroll to prevent drifting
    const container = containerRef.current;
    const handleScroll = () => {
      // Don't clear if popover is open (user might be reposting)
      // Also ignore scroll events immediately after selection (grace period for inertial scroll)
      if (selection && !isPopoverOpenRef.current && (Date.now() - selection.timestamp > 500)) {
        setSelection(null);
      }
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
  // Scroll restoration and progress tracking
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestProgressRef = useRef(0);

  // Restore scroll position
  useEffect(() => {
    if (!user || hasRestoredScroll) return;

    const loadProgress = async () => {
      const { data } = await supabase
        .from('reading_activity')
        .select('progress')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .single();

      if (data?.progress && data.progress > 0 && containerRef.current) {
        // Allow a brief moment for layout paint
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (containerRef.current) {
              const { scrollHeight, clientHeight } = containerRef.current;
              const targetScroll = (scrollHeight - clientHeight) * data.progress;
              containerRef.current.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
              });
            }
          }, 100);
        });
      }
      setHasRestoredScroll(true);
    };
    loadProgress();
  }, [article.id, user, hasRestoredScroll]);

  // Optimized save function
  const debouncedSave = useCallback((progress: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (user) {
        updateReadingProgress(article.id, user.id, progress);
      }
    }, 1000); // 1.5s debounce for optimal performance
  }, [article.id, user]);

  // Track scroll progress
  useEffect(() => {
    if (!containerRef.current || !user) return;

    const unsubscribe = scrollYProgress.on("change", (latest) => {
      latestProgressRef.current = latest;
      debouncedSave(latest);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // Attempt to save final position on unmount/close
      if (latestProgressRef.current > 0) {
        updateReadingProgress(article.id, user.id, latestProgressRef.current);
      }
    };
  }, [scrollYProgress, article.id, user, debouncedSave]);

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

        <div className="flex items-center space-x-4 relative z-10">
          <Button variant="ghost" size="icon" onClick={handleLike} className={isLiked ? "text-red-500" : "text-gray-400"}>
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </Button>
          <AddToStack article={article}>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <Layers size={18} />
            </Button>
          </AddToStack>
          <Button variant="ghost" size="icon" onClick={handleShare} className="text-gray-400">
            <Share2 size={18} />
          </Button>
        </div>

        {/* Centered Article Info */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full px-24 flex items-center justify-center space-x-3">
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold shrink-0">
            {article.source}
          </span>
          <span className="text-gray-300 dark:text-gray-700 text-xs">•</span>
          <span className="text-base font-serif font-medium text-gray-900 dark:text-gray-100 truncate max-w-[500px]">
            {article.title}
          </span>
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Hero Mode</span>
                  <Switch
                    checked={settings.heroMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, heroMode: checked })}
                  />
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
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  onMouseDown={(e) => e.preventDefault()} // Prevent focus loss/selection clearing on click
                  className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold hover:text-gray-300"
                >
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

      <div className="min-h-screen pb-32">
        {settings.heroMode && article.imageUrl ? (
          <div className="relative w-full h-[60vh] md:h-[70vh] flex items-end justify-center mb-12">
            <div className="absolute inset-0">
              <img
                src={article.imageUrl}
                alt=""
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  heroImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setHeroImageLoaded(true)}
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 -z-10" />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-12 md:pb-20 text-center text-white">
              <p className="text-xs uppercase tracking-[0.4em] font-bold text-white/80 mb-4 drop-shadow-md">{article.source} • {article.publishedAt}</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] tracking-tight mb-6 text-white drop-shadow-lg">{article.title}</h1>
              <div className="flex items-center justify-center space-x-4 text-lg font-serif italic text-white/90 drop-shadow-md">
                <span>by {article.author}</span>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span>{article.readingTime}</span>
              </div>
            </div>
          </div>
        ) : null}

        <article className={cn(
          settings.layout === 'narrow' ? 'max-w-2xl' : settings.layout === 'wide' ? 'max-w-5xl' : 'max-w-3xl',
          "mx-auto px-6",
          settings.heroMode && article.imageUrl ? "pt-12" : "pt-32"
        )}>
          {!settings.heroMode && (
            <header className="mb-20 space-y-6">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">{article.source} • {article.publishedAt}</p>
              <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.0] tracking-tight">{article.title}</h1>
              <div className="flex items-center space-x-4 text-xl font-serif italic text-gray-400 border-t pt-8">
                <span>by {article.author}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{article.readingTime}</span>
              </div>
            </header>
          )}

          {/* Same header if no image in hero mode? We can fall back */}
          {settings.heroMode && !article.imageUrl && (
            <header className="mb-20 space-y-6">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">{article.source} • {article.publishedAt}</p>
              <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.0] tracking-tight">{article.title}</h1>
              <div className="flex items-center space-x-4 text-xl font-serif italic text-gray-400 border-t pt-8">
                <span>by {article.author}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{article.readingTime}</span>
              </div>
            </header>
          )}

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
              // Hide first image if Hero Mode is on (to avoid duplication)
              settings.heroMode && article.imageUrl ? "[&>*:first-child_img]:hidden [&>figure:first-child]:hidden [&>img:first-child]:hidden" : "",
              settings.fontType === 'serif' ? 'font-serif' : settings.fontType === 'mono' ? 'font-mono' : 'font-sans',
              theme === 'light' ? 'prose-gray' : 'prose-invert prose-gray'
            )}
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <footer className="mt-24 mb-12 flex flex-col items-center justify-center space-y-6 border-t border-gray-100 dark:border-gray-800 pt-12">
            <p className="font-serif italic text-gray-400 dark:text-gray-500 text-lg">
              End of article
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-bold border border-gray-200 dark:border-gray-800 px-6 py-3 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-black transition-all"
            >
              <span>Read Original on {article.source}</span>
              <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </footer>
        </article>
      </div>
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