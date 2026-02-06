"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, ExternalLink, Type, Moon, Sun, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react';
import { Article } from '@/types/article';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { saveScrollPosition, getScrollPosition } from '@/lib/scrollPositionDB';
import { useTheme } from '@/contexts/ThemeContext';

interface ReaderViewProps {
  article: Article | null;
  onClose: () => void;
}

type FontType = 'serif' | 'sans' | 'mono';
type LayoutType = 'narrow' | 'standard' | 'wide';

interface Heading {
  text: string;
  level: number;
  id: string;
  offset: number;
}

const STORAGE_KEY = 'open-shelf-reader-settings';

const ReaderContent = ({ article, onClose }: { article: Article, onClose: () => void }) => {
  const { theme, setTheme } = useTheme();

  // Persistence logic for reader settings (excluding theme)
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
      return {
        fontSize: 20,
        lineHeight: 1.75,
        fontType: 'sans' as FontType,
        layout: 'standard' as LayoutType
      };
    }
  });

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const scrollRestored = useRef(false);

  // Extract headings from content
  useEffect(() => {
    if (!contentRef.current) return;

    const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4');
    const extractedHeadings: Heading[] = [];

    headingElements.forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;
      extractedHeadings.push({
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
        id,
        offset: (heading as HTMLElement).offsetTop,
      });
    });

    setHeadings(extractedHeadings);
  }, [article.content]);

  // Restore scroll position
  useEffect(() => {
    if (!containerRef.current || scrollRestored.current) return;

    const restoreScroll = async () => {
      const savedPosition = await getScrollPosition(article.id);
      if (savedPosition > 0 && containerRef.current) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          containerRef.current?.scrollTo({ top: savedPosition, behavior: 'instant' as ScrollBehavior });
          scrollRestored.current = true;
        }, 100);
      } else {
        scrollRestored.current = true;
      }
    };

    restoreScroll();
  }, [article.id]);

  // Save scroll position periodically
  useEffect(() => {
    if (!containerRef.current) return;

    let saveTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (containerRef.current) {
          saveScrollPosition(article.id, containerRef.current.scrollTop);
        }
      }, 500); // Debounce saves
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(saveTimeout);
      // Final save on unmount
      if (container) {
        saveScrollPosition(article.id, container.scrollTop);
      }
    };
  }, [article.id]);

  // Track active heading
  useEffect(() => {
    if (!containerRef.current || headings.length === 0) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop + 100; // Offset for header

      for (let i = headings.length - 1; i >= 0; i--) {
        if (scrollTop >= headings[i].offset) {
          setActiveHeading(headings[i].id);
          return;
        }
      }
      setActiveHeading(null);
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, [headings]);

  // Eager image loading
  useEffect(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;
    const images = tempDiv.querySelectorAll('img');

    images.forEach((img) => {
      const image = new Image();
      image.src = img.src;
    });
  }, [article.content]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element && containerRef.current) {
      const offset = element.offsetTop - 80; // Account for header
      containerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  const layoutMaxWidth = {
    narrow: 'max-w-2xl',
    standard: 'max-w-3xl',
    wide: 'max-w-5xl'
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: '100vh' }}
      animate={{ y: 0 }}
      exit={{ y: '100vh' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto transition-colors duration-500",
        theme === 'light' ? 'bg-[#fff] text-gray-900' : 'bg-[#0a0a0a] text-gray-100'
      )}
    >
      {/* Editorial Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 transition-all duration-300",
        theme === 'light' ? 'bg-white/95 backdrop-blur-sm border-b border-gray-50' : 'bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-900'
      )}>
        <motion.div className={cn("absolute bottom-0 left-0 right-0 h-[1.5px] origin-left", theme === 'light' ? 'bg-gray-900' : 'bg-gray-100')} style={{ scaleX }} />
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className={cn("text-[9px] uppercase tracking-[0.3em] font-sans font-semibold whitespace-nowrap", theme === 'light' ? 'text-gray-400' : 'text-gray-600')}>{article.source}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <p className={cn("text-[10px] uppercase tracking-wider truncate font-sans font-medium", theme === 'light' ? 'text-gray-500' : 'text-gray-400')}>{article.title}</p>
        </div>
        <div className="flex items-center space-x-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white"><Type size={16} /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-5 space-y-6 rounded-none border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950" align="end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Appearance</span>
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded-none p-0.5">
                    <button onClick={() => setTheme('light')} className={cn("p-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800", theme === 'light' ? 'bg-gray-100 dark:bg-gray-800' : '')}><Sun size={12} /></button>
                    <button onClick={() => setTheme('dark')} className={cn("p-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800", theme === 'dark' ? 'bg-gray-100 dark:bg-gray-800' : '')}><Moon size={12} /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Layout</span>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      variant={settings.layout === 'narrow' ? 'secondary' : 'outline'}
                      size="sm"
                      className="rounded-none text-[10px] h-7 p-0"
                      onClick={() => updateSetting('layout', 'narrow')}
                    >
                      <AlignLeft size={14} />
                    </Button>
                    <Button
                      variant={settings.layout === 'standard' ? 'secondary' : 'outline'}
                      size="sm"
                      className="rounded-none text-[10px] h-7 p-0"
                      onClick={() => updateSetting('layout', 'standard')}
                    >
                      <AlignCenter size={14} />
                    </Button>
                    <Button
                      variant={settings.layout === 'wide' ? 'secondary' : 'outline'}
                      size="sm"
                      className="rounded-none text-[10px] h-7 p-0"
                      onClick={() => updateSetting('layout', 'wide')}
                    >
                      <AlignJustify size={14} />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Typeface</span>
                  <div className="grid grid-cols-3 gap-1">
                    {['serif', 'sans', 'mono'].map((f) => (
                      <Button key={f} variant={settings.fontType === f ? 'secondary' : 'outline'} size="sm" className="rounded-none text-[10px] h-7 capitalize" onClick={() => updateSetting('fontType', (f as FontType))} >{f}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Size</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{settings.fontSize}px</span>
                  </div>
                  <Slider value={[settings.fontSize]} onValueChange={(v) => updateSetting('fontSize', v[0])} min={16} max={28} step={1} className="py-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Line</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{settings.lineHeight.toFixed(2)}</span>
                  </div>
                  <Slider value={[settings.lineHeight]} onValueChange={(v) => updateSetting('lineHeight', v[0])} min={1.4} max={2.2} step={0.05} className="py-2" />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={18} /></Button>
        </div>
      </div>

      {/* Chapter Navigation - Substack Style Minimal */}
      {headings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed right-8 top-1/2 -translate-y-1/2 hidden xl:block group"
        >
          <div className="space-y-3">
            {headings.filter(h => h.level <= 3).map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className="relative flex items-center justify-end transition-all duration-200 group/item"
              >
                {/* Horizontal line */}
                <div className={cn(
                  "h-[2px] rounded-full transition-all duration-200",
                  activeHeading === heading.id
                    ? theme === 'light'
                      ? 'w-8 bg-black'
                      : 'w-8 bg-white'
                    : theme === 'light'
                      ? 'w-6 bg-gray-400 group-hover/item:bg-gray-700 group-hover/item:w-7'
                      : 'w-6 bg-gray-500 group-hover/item:bg-gray-300 group-hover/item:w-7'
                )} />

                {/* Heading text - shows on hover */}
                <span className={cn(
                  "absolute right-10 text-[11px] leading-tight transition-all duration-200 whitespace-nowrap",
                  "opacity-0 translate-x-2 pointer-events-none",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                  "px-3 py-1.5 rounded-md",
                  activeHeading === heading.id
                    ? theme === 'light'
                      ? 'text-black font-bold bg-gray-100'
                      : 'text-white font-bold bg-gray-800'
                    : theme === 'light'
                      ? 'text-gray-700 font-medium bg-gray-50'
                      : 'text-gray-300 font-medium bg-gray-900',
                  heading.level === 3 ? 'text-[10px]' : ''
                )}>
                  {heading.text.length > 25 ? heading.text.substring(0, 25) + '...' : heading.text}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}


      <motion.article
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(layoutMaxWidth[settings.layout as LayoutType], "mx-auto px-6 md:px-10 py-32")}
      >
        <header className="mb-24 space-y-10">
          <div className="space-y-6">
            <p className={cn("text-[10px] uppercase tracking-[0.5em] font-sans font-bold", theme === 'light' ? 'text-gray-400' : 'text-gray-600')}>{article.source} • {article.publishedAt}</p>
            <h1 className={cn("text-5xl md:text-7xl font-serif font-medium leading-[1.0] tracking-tight", theme === 'light' ? 'text-gray-900' : 'text-gray-100')}>{article.title}</h1>
            <div className={cn("flex items-center space-x-4 text-xl md:text-2xl font-serif italic border-t pt-8", theme === 'light' ? 'text-gray-400 border-gray-50' : 'text-gray-500 border-gray-900')}>
              <span>by {article.author}</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-20" />
              <span>{article.readingTime}</span>
            </div>
          </div>
        </header>

        <div
          ref={contentRef}
          className={cn(
            "prose prose-lg max-w-none transition-all duration-300 selection:bg-gray-100 selection:text-black",
            settings.fontType === 'serif' ? 'font-serif' : settings.fontType === 'mono' ? 'font-mono' : 'font-sans',
            theme === 'light' ? 'prose-gray' : 'prose-invert prose-gray',
            "[&_img]:mx-auto [&_img]:block [&_img]:rounded-none [&_img]:mt-16 [&_img]:mb-8 [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-[70vh] [&_img]:object-contain",
            "[&_figure]:max-w-full [&_figure]:mx-auto [&_figure]:my-16",
            "[&_video]:max-w-full [&_video]:mx-auto",
            "[&_iframe]:max-w-full [&_iframe]:mx-auto",
            "[&_pre]:overflow-x-auto [&_pre]:max-w-full",
            "[&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full",
            // Hide common RSS "expand" icons or meta buttons
            "[&_button]:hidden [&_a.expand]:hidden [&_div.expand]:hidden [&_.image-expand]:hidden",
            "[&_p]:mb-8 [&_p]:leading-relaxed",
            "[&_h2]:font-serif [&_h2]:text-3xl [&_h2]:mt-16 [&_h2]:mb-8 [&_h2]:scroll-mt-20",
            "[&_h3]:font-serif [&_h3]:text-2xl [&_h3]:mt-12 [&_h3]:mb-6 [&_h3]:scroll-mt-20",
            "[&_blockquote]:border-l-[1px] [&_blockquote]:border-gray-200 [&_blockquote]:italic [&_blockquote]:text-2xl [&_blockquote]:font-serif [&_blockquote]:pl-10 [&_blockquote]:my-16",
            // Link styling: subtle underline and color change
            theme === 'light'
              ? "prose-a:underline prose-a:underline-offset-4 prose-a:decoration-gray-200 hover:prose-a:decoration-gray-900 prose-a:text-gray-900 transition-colors"
              : "prose-a:underline prose-a:underline-offset-4 prose-a:decoration-gray-600 hover:prose-a:decoration-gray-300 prose-a:text-gray-100 transition-colors"
          )}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <footer className="mt-40 pt-20 border-t border-gray-50 dark:border-gray-900 flex justify-center">
          <Button
            variant="outline"
            asChild
            className={cn("rounded-none px-10 h-14 text-[10px] uppercase tracking-[0.4em] transition-all", theme === 'light' ? 'border-gray-200 hover:bg-gray-900 hover:text-white' : 'border-gray-800 text-gray-500 hover:bg-white hover:text-black')}
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3">
              <span>Read Original</span>
              <ExternalLink size={12} />
            </a>
          </Button>
        </footer>
      </motion.article>
    </motion.div >
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