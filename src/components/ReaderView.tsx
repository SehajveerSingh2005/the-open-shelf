"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
          className="fixed inset-0 z-50 bg-white overflow-y-auto"
        >
          <div className="max-w-2xl mx-auto px-6 py-20 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="fixed top-8 right-8 text-gray-400 hover:text-gray-900 z-50"
            >
              <X size={24} />
            </Button>

            <motion.header 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-12 space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-sans">
                  {article.source} • {article.publishedAt}
                </p>
                <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight text-gray-900">
                  {article.title}
                </h1>
                <p className="text-lg text-gray-500 font-serif italic">
                  by {article.author}
                </p>
              </div>
              <div className="h-px w-24 bg-gray-100" />
            </motion.header>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-gray prose-lg max-w-none font-sans leading-relaxed text-gray-800 
                prose-headings:font-serif prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:border-l-gray-200"
            >
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </motion.div>
            
            <footer className="mt-20 pt-8 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400 font-sans">
                Source: <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">{article.source}</a> • {article.readingTime}
              </p>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReaderView;