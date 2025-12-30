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
      layoutId={`card-${article.id}`}
      drag={isCanvas}
      dragMomentum={false}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onClick(article)}
      className={`
        bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer
        ${isCanvas ? 'absolute w-64' : 'w-full mb-6'}
      `}
      style={isCanvas ? { left: article.x, top: article.y } : {}}
      whileHover={{ y: -2 }}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">
            {article.source} • {article.readingTime}
          </p>
          <h3 className="text-xl font-serif font-medium leading-tight text-gray-900">
            {article.title}
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-3 font-serif leading-relaxed">
          {article.excerpt}
        </p>
        
        <div className="pt-2">
          <p className="text-[11px] text-gray-500 font-sans italic">
            by {article.author}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;