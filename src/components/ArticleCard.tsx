"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from '@/types/article';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  onClick: (article: Article) => void;
  isCanvas?: boolean;
}

const optimizeImageUrl = (url: string) => {
  if (!url) return url;
  // Substack image optimization
  if (url.includes('substack-post-media.s3.amazonaws.com') || url.includes('images.substack.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=600&auto=format&q=75`;
  }
  // Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=600&q=75&auto=format`;
  }
  return url;
};

const ArticleCard = React.memo(({ article, onClick, isCanvas = false }: ArticleCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(article)}
      className={cn(
        "bg-white border border-gray-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-200 cursor-pointer group overflow-hidden",
        isCanvas ? 'w-[320px]' : 'w-full mb-6'
      )}
    >
      {article.imageUrl && (
        <div className="w-full h-44 overflow-hidden bg-gray-50 border-b border-gray-100/50 relative">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse transition-opacity duration-500",
            imageLoaded ? "opacity-0" : "opacity-100"
          )} />
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            src={optimizeImageUrl(article.imageUrl)} 
            alt={article.title}
            onLoad={() => setImageLoaded(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
        
        <p className="text-[13px] text-gray-500 line-clamp-3 font-serif italic leading-relaxed">
          {article.excerpt}
        </p>
        
        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-sans font-medium">by {article.author}</p>
          <span className="text-[9px] text-gray-300 font-sans">{article.publishedAt}</span>
        </div>
      </div>
    </motion.div>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;