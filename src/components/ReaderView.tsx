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

// Internal component to handle scroll logic safely only when article exists
const ReaderContent = ({ article, onClose }: { article: Article, onClose: () => void }) => {
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontType, setFontType] = useState<FontType>('sans');
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
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto transition-colors duration-300",
        theme === 'light' ? 'bg-white text-gray-900' : 'bg-[#121212] text-gray-100'
      )}
    >
      {/* Header Controls */}
      <div className={cn(
        "fixed top-0 left-0 right-0 h-16 border-b z-50 flex items-center justify-between px-6 backdrop-blur-md",
        theme === 'light' 
          ? 'bg-white/80 border-gray-100' 
          : 'bg-[#121212]/80 border-gray-800'
      )}>
        {/* Scroll Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100 origin-left"
          style={{ scaleX }}
        />

        <div className="flex items-center space-x-2">
          <p className={cn(
            "text-[10px] uppercase tracking-widest truncate max-w-[200px] md:max-w-md font-sans",
            theme === 'light' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {article.source} • {article.title}
          </p>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500'}>
                <Type size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 space-y-6" align="end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Theme</span>
                  <div className="flex border rounded-none p-0.5">
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn("p-1.5 transition-colors", theme === 'light' ? 'bg-gray-100' : '')}
                    >
                      <Sun size={14} />
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn("p-1.5 transition-colors", theme === 'dark' ? 'bg-gray-100' : '')}
                    >
                      <Moon size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-500">Font Type</span>
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      variant={fontType === 'sans' ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-none text-[10px]"
                      onClick={() => setFontType('sans')}
                    >
                      Sans
                    </Button>
                    <Button 
                      variant={fontType === 'serif' ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-none text-[10px]"
                      onClick={() => setFontType('serif')}
                    >
                      Serif
                    </Button>
                    <Button 
                      variant={fontType === 'mono' ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-none text-[10px]"
                      onClick={() => setFontType('mono')}
                    >
                      Mono
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Text Size</span>
                    <span className="text-[10px] text-gray-400">{fontSize}px</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Minus size={14} className="text-gray-400" />
                    <Slider 
                      value={[fontSize]} 
                      onValueChange={(v) => setFontSize(v[0])} 
                      min={14} max={32} step={1} 
                    />
                    <Plus size={14} className="text-gray-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Line Spacing</span>
                    <span className="text-[10px] text-gray-400">{lineHeight.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <AlignLeft size={14} className="text-gray-400" />
                    <Slider 
                      value={[lineHeight]} 
                      onValueChange={(v) => setLineHeight(v[0])} 
                      min={1.2} max={2.2} step={0.1} 
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
              "p-2 transition-colors",
              theme === 'light' ? 'text-gray-400 hover:text-gray-900' : 'text-gray-500 hover:text-gray-100'
            )}
          >
            <ExternalLink size={18} />
          </a>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={theme === 'dark' ? 'text-gray-400 hover:text-gray-100' : 'text-gray-500 hover:text-gray-900'}
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="max-w-4xl mx-auto px-8 md:px-12 py-32"
      >
        <header className="mb-24 space-y-6">
          <div className="space-y-6">
            <p className={cn(
              "text-[11px] uppercase tracking-[0.4em] font-sans font-medium",
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {article.source} • {article.publishedAt}
            </p>
            <h1 className={cn(
              "text-5xl md:text-7xl font-serif font-medium leading-[1.05] tracking-tight",
              theme === 'light' ? 'text-gray-900' : 'text-gray-100'
            )}>
              {article.title}
            </h1>
            <div className={cn(
              "flex items-center space-x-4 text-xl md:text-2xl font-serif italic",
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            )}>
              <span>by {article.author}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />
              <span>{article.readingTime}</span>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "prose prose-lg max-w-none transition-all duration-300",
            fontType === 'serif' ? 'font-serif' : fontType === 'mono' ? 'font-mono' : 'font-sans',
            theme === 'light' ? 'prose-gray' : 'prose-invert prose-gray',
            // Image centering and basic styling
            "[&_img]:mx-auto [&_img]:block [&_img]:rounded-none [&_img]:shadow-sm [&_img]:mt-16 [&_img]:mb-4",
            // Robust caption styling for standard tags and custom RSS markers
            "[&_figcaption]:text-center [&_figcaption]:text-[13px] [&_figcaption]:mt-4 [&_figcaption]:mb-16 [&_figcaption]:italic [&_figcaption]:opacity-50 [&_figcaption]:font-sans",
            "[&_.wp-caption-text]:text-center [&_.wp-caption-text]:text-[13px] [&_.wp-caption-text]:mt-4 [&_.wp-caption-text]:mb-16 [&_.wp-caption-text]:italic [&_.wp-caption-text]:opacity-50 [&_.wp-caption-text]:font-sans",
            "[&_.caption]:text-center [&_.caption]:text-[13px] [&_.caption]:mt-4 [&_.caption]:mb-16 [&_.caption]:italic [&_.caption]:opacity-50 [&_.caption]:font-sans",
            // Blockquotes and links
            "prose-blockquote:border-l-gray-300 prose-blockquote:italic prose-blockquote:text-2xl prose-blockquote:font-serif prose-blockquote:py-2",
            "prose-a:decoration-gray-300 hover:prose-a:decoration-gray-900 prose-a:underline-offset-4 transition-colors"
          )}
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        <footer className="mt-40 pt-20 border-t border-gray-100/10 text-center">
          <Button 
            variant="outline" 
            asChild
            className={cn(
              "rounded-none px-12 py-8 text-[11px] uppercase tracking-[0.3em] transition-all",
              theme === 'light' 
                ? 'border-gray-200 hover:bg-gray-900 hover:text-white' 
                : 'border-gray-800 text-gray-400 hover:bg-white hover:text-black'
            )}
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read Original Source
            </a>
          </Button>
        </footer>
      </motion.div>
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