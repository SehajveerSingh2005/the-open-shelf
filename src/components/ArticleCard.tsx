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
        bg-white border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group
        ${isCanvas ? 'w-[340px]' : 'w-full mb-6'}
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
        
        {/* Only render excerpt if it's not a tiny canvas card to save Firefox resources */}
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