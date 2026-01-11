"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
  onClick: (article: Article) => void;
  isCanvas?: boolean;
}

const ArticleCard = ({ article, onClick, isCanvas = false }: ArticleCardProps) => {
  return (
    <motion.div
      // We disable layoutId and layout projection on the canvas to ensure total stability.
      // The glitching was caused by Framer Motion trying to project layout states 
      // while the parent container was panned and scaled.
      layoutId={isCanvas ? undefined : `card-${article.id}`}
      layout={isCanvas ? false : "position"}
      // We remove the 'initial' fade-in to prevent flickering when articles render
      animate={{ opacity: 1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onClick(article)}
      className={`
        bg-white border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer group
        ${isCanvas ? 'w-[340px]' : 'w-full'}
      `}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-sans font-semibold">
              {article.source}
            </p>
            <p className="text-[9px] text-gray-300 font-sans uppercase tracking-widest">{article.readingTime}</p>
          </div>
          <h3 className="text-xl font-serif font-medium leading-tight text-gray-900 group-hover:text-black transition-colors">
            {article.title}
          </h3>
        </div>
        
        <p className="text-[13px] text-gray-500 line-clamp-3 font-serif italic leading-relaxed group-[.scale-reduced]:hidden">
          {article.excerpt}
        </p>
        
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between group-[.scale-reduced]:hidden">
          <p className="text-[10px] text-gray-400 font-sans italic">by {article.author}</p>
          <span className="text-[9px] text-gray-300 font-sans">{article.publishedAt}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;