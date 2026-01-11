"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, ExternalLink, Type, Moon, Sun, Minus, Plus, AlignLeft } from 'lucide-react';
import { Article } from '@/types/article';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ReaderViewProps {
  article: Article | null;
  onClose: () => void;
}

type FontType = 'serif' | 'sans' | 'mono';

const ReaderContent = ({ article, onClose }: { article: Article, onClose: () => void }) => {
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.75);
  const [fontType, setFontType] = useState<FontType>('sans'); // Defaulting back to sans
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto transition-colors duration-500",
        theme === 'light' ? 'bg-[#fff] text-gray-900' : 'bg-[#0a0a0a] text-gray-100'
      )}
    >
      <div className={cn(
        "fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 transition-all duration-300",
        theme === 'light' 
          ? 'bg-white border-b border-gray-50' 
          : 'bg-[#0a0a0a] border-b border-gray-900'
      )}>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gray-900 dark:bg-gray-100 origin-left"
          style={{ scaleX }}
        />

        <div className="flex items-center space-x-3 overflow-hidden">
          <span className={cn(
            "text-[9px] uppercase tracking-[0.3em] font-sans font-semibold whitespace-nowrap",
            theme === 'light' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {article.source}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <p className={cn(
            "text-[10px] uppercase tracking-wider truncate font-sans font-medium",
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {article.title}
          </p>
        </div>

        <div className="flex items-center space-x-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <Type size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-5 space-y-6 rounded-none border-gray-100" align="end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Appearance</span>
                  <div className="flex border rounded-none p-0.5">
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn("p-1.5 transition-colors", theme === 'light' ? 'bg-gray-100' : '')}
                    >
                      <Sun size={12} />
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn("p-1.5 transition-colors", theme === 'dark' ? 'bg-gray-100' : '')}
                    >
                      <Moon size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Typeface</span>
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      variant={fontType === 'serif' ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-none text-[10px] h-7"
                      onClick={() => setFontType('serif')}
                    >
                      Serif
                    </Button>
                    <Button 
                      variant={fontType === 'sans' ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-none text-[10px] h-7"
                      onClick={() => setFontType('sans')}
                    >
                      Sans
                    </Button>
                    <Button 
                      variant={fontType === 'mono' ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-none text-[10px] h-7"
                      onClick={() => setFontType('mono')}
                    >
                      Mono
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Size</span>
                    <span className="text-[10px] text-gray-500">{fontSize}px</span>
                  </div>
                  <Slider 
                    value={[fontSize]} 
                    onValueChange={(v) => setFontSize(v[0])} 
                    min={16} max={28} step={1} 
                    className="py-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Line</span>
                    <span className="text-[10px] text-gray-500">{lineHeight.toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[lineHeight]} 
                    onValueChange={(v) => setLineHeight(v[0])} 
                    min={1.4} max={2.2} step={0.05} 
                    className="py-2"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      <motion.article 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto px-6 md:px-10 py-32"
      >
        <header className="mb-24 space-y-10">
          <div className="space-y-6">
            <p className={cn(
              "text-[10px] uppercase tracking-[0.5em] font-sans font-bold",
              theme === 'light' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {article.source} • {article.publishedAt}
            </p>
            <h1 className={cn(
              "text-5xl md:text-7xl font-serif font-medium leading-[1.0] tracking-tight",
              theme === 'light' ? 'text-gray-900' : 'text-gray-100'
            )}>
              {article.title}
            </h1>
            <div className={cn(
              "flex items-center space-x-4 text-xl md:text-2xl font-serif italic border-t pt-8",
              theme === 'light' ? 'text-gray-400 border-gray-50' : 'text-gray-500 border-gray-900'
            )}>
              <span>by {article.author}</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-20" />
              <span>{article.readingTime}</span>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "prose prose-lg max-w-none transition-all duration-300 selection:bg-gray-100 selection:text-black",
            fontType === 'serif' ? 'font-serif' : fontType === 'mono' ? 'font-mono' : 'font-sans',
            theme === 'light' ? 'prose-gray' : 'prose-invert prose-gray',
            "[&_img]:mx-auto [&_img]:block [&_img]:rounded-none [&_img]:mt-16 [&_img]:mb-8 [&_img]:max-w-full",
            "[&_p]:mb-8 [&_p]:leading-relaxed",
            "[&_h2]:font-serif [&_h2]:text-3xl [&_h2]:mt-16 [&_h2]:mb-8",
            "[&_blockquote]:border-l-[1px] [&_blockquote]:border-gray-200 [&_blockquote]:italic [&_blockquote]:text-2xl [&_blockquote]:font-serif [&_blockquote]:pl-10 [&_blockquote]:my-16",
            "prose-a:underline prose-a:underline-offset-4 prose-a:decoration-gray-200 hover:prose-a:decoration-gray-900 transition-colors"
          )}
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: lineHeight,
            textTransform: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        <footer className="mt-40 pt-20 border-t border-gray-50 dark:border-gray-900 flex justify-center">
          <Button 
            variant="outline" 
            asChild
            className={cn(
              "rounded-none px-10 h-14 text-[10px] uppercase tracking-[0.4em] transition-all",
              theme === 'light' 
                ? 'border-gray-200 hover:bg-gray-900 hover:text-white' 
                : 'border-gray-800 text-gray-500 hover:bg-white hover:text-black'
            )}
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3">
              <span>Read Original</span>
              <ExternalLink size={12} />
            </a>
          </Button>
        </footer>
      </motion.article>
    </motion.div>
  );
};

const ReaderView = ({ article, onClose }: ReaderViewProps) => {
  return (
    <AnimatePresence mode="wait">
      {article && (
        <ReaderContent 
          key={article.id} 
          article={article} 
          onClose={onClose} 
        />
      )}
    </AnimatePresence>
  );
};

export default ReaderView;