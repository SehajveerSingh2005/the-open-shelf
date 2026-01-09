"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { Article } from '@/types/article';
import { Button } from '@/components/ui/button';

interface ReaderViewProps {
  article: Article | null;
  onClose: () => void;
}

const ReaderView = ({ article, onClose }: ReaderViewProps) => {
  return (
    <AnimatePresence>
      {article && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-white overflow-y-auto"
        >
          {/* Controls */}
          <div className="fixed top-8 right-8 flex items-center space-x-4 z-50">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ExternalLink size={20} />
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900"
            >
              <X size={24} />
            </Button>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto px-6 py-20"
          >
            <header className="mb-16 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans">
                  {article.source} • {article.publishedAt}
                </p>
                <h1 className="text-5xl md:text-6xl font-serif font-medium leading-[1.1] text-gray-900 tracking-tight">
                  {article.title}
                </h1>
                <div className="flex items-center space-x-4 text-lg text-gray-500 font-serif italic">
                  <span>by {article.author}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                  <span>{article.readingTime}</span>
                </div>
              </div>
            </header>

            <div
              className="prose prose-gray prose-lg max-w-none font-sans leading-relaxed text-gray-800 
                prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
                prose-p:mb-8 prose-p:leading-8
                prose-img:rounded-none prose-img:mx-auto
                prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-2xl prose-blockquote:text-gray-500 prose-blockquote:border-l-gray-900 prose-blockquote:py-2
                prose-a:text-gray-900 prose-a:underline-offset-4 prose-a:decoration-gray-200 hover:prose-a:decoration-gray-900 transition-all"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            
            <footer className="mt-32 pt-12 border-t border-gray-100 text-center">
              <Button 
                variant="outline" 
                asChild
                className="rounded-none border-gray-200 px-8 py-6 text-[10px] uppercase tracking-widest hover:bg-gray-900 hover:text-white"
              >
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  Continue Reading on Source
                </a>
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReaderView;