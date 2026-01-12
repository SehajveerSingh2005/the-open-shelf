"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
  onClick: (article: Article) => void;
  isCanvas?: boolean;
}

const ArticleCard = React.memo(({ article, onClick, isCanvas = false }: ArticleCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onClick(article)}
      className={`
        bg-white border border-gray-100 p-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden
        ${isCanvas ? 'w-[320px]' : 'w-full mb-6'}
      `}
    >
      {article.imageUrl && (
        <div className="w-full h-44 overflow-hidden bg-gray-50 border-b border-gray-50">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-sans font-bold">
              {article.source}
            </p>
            <p className="text-[8px] text-gray-300 font-sans uppercase tracking-widest">{article.readingTime}</p>
          </div>
          <h3 className="text-lg font-serif font-medium leading-tight text-gray-900 group-hover:text-black transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        
        <p className="text-[12px] text-gray-500 line-clamp-3 font-serif italic leading-relaxed [.scale-reduced_&]:hidden">
          {article.excerpt}
        </p>
        
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between [.scale-reduced_&]:hidden">
          <p className="text-[9px] text-gray-400 font-sans italic">by {article.author}</p>
          <span className="text-[8px] text-gray-300 font-sans">{article.publishedAt}</span>
        </div>
      </div>
    </motion.div>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;