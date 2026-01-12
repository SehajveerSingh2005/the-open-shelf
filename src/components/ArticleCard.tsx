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
      whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
      onClick={() => onClick(article)}
      className={`
        bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 cursor-pointer group overflow-hidden
        ${isCanvas ? 'w-[320px]' : 'w-full mb-6'}
      `}
    >
      {article.imageUrl && (
        <div className="w-full h-44 overflow-hidden bg-gray-50 border-b border-gray-50/50">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-sans font-bold">
              {article.source}
            </p>
            <p className="text-[9px] text-gray-300 font-sans uppercase tracking-widest">{article.readingTime}</p>
          </div>
          <h3 className="text-[17px] font-sans font-semibold leading-tight text-gray-900 group-hover:text-black transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        
        <p className="text-[13px] text-gray-500 line-clamp-3 font-serif italic leading-relaxed [.scale-reduced_&]:hidden">
          {article.excerpt}
        </p>
        
        <div className="pt-3 border-t border-gray-50 flex items-center justify-between [.scale-reduced_&]:hidden">
          <p className="text-[10px] text-gray-400 font-sans font-medium">by {article.author}</p>
          <span className="text-[9px] text-gray-300 font-sans">{article.publishedAt}</span>
        </div>
      </div>
    </motion.div>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;