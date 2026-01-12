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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onClick(article)}
      className={`
        bg-white border border-gray-100 p-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden
        ${isCanvas ? 'w-[340px]' : 'w-full mb-6'}
      `}
    >
      {article.imageUrl && (
        <div className="w-full h-48 overflow-hidden bg-gray-50">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-sans font-bold">
              {article.source}
            </p>
            <p className="text-[9px] text-gray-300 font-sans uppercase tracking-widest">{article.readingTime}</p>
          </div>
          <h3 className="text-xl font-serif font-medium leading-tight text-gray-900 group-hover:text-black transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        
        <p className="text-[13px] text-gray-500 line-clamp-3 font-serif italic leading-relaxed [.scale-reduced_&]:hidden">
          {article.excerpt}
        </p>
        
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between [.scale-reduced_&]:hidden">
          <p className="text-[10px] text-gray-400 font-sans italic">by {article.author}</p>
          <span className="text-[9px] text-gray-300 font-sans">{article.publishedAt}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;