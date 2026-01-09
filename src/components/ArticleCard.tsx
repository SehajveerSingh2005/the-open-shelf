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
  const variants = {
    hidden: { opacity: 0, scale: 0.92, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => onClick(article)}
      className={`
        bg-white border border-gray-100 p-7 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group
        ${isCanvas ? 'w-72' : 'w-full mb-8'}
      `}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="h-px w-4 bg-gray-200" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans">
              {article.source}
            </p>
          </div>
          <h3 className="text-2xl font-serif font-medium leading-tight text-gray-900 group-hover:text-black transition-colors">
            {article.title}
          </h3>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-4 font-serif italic leading-relaxed">
          {article.excerpt}
        </p>
        
        <div className="pt-4 flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-300 font-sans">Author</p>
            <p className="text-[11px] text-gray-600 font-sans font-medium">{article.author}</p>
          </div>
          <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest">{article.readingTime}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;