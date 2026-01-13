"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/types/article';
import { cn } from '@/lib/utils';

// Global cache to track which images have finished loading
// This prevents "blinking" when the same article mounts in a new position on the infinite canvas
const LOADED_IMAGES = new Set<string>();

interface ArticleCardProps {
  article: Article;
  onClick: (article: Article) => void;
  isCanvas?: boolean;
}

const optimizeImageUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('substack-post-media.s3.amazonaws.com') || url.includes('images.substack.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=600&auto=format&q=75`;
  }
  if (url.includes('images.unsplash.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=600&q=75&auto=format`;
  }
  return url;
};

const ArticleCard = React.memo(({ article, onClick, isCanvas = false }: ArticleCardProps) => {
  const imageUrl = article.imageUrl ? optimizeImageUrl(article.imageUrl) : null;
  const [imageLoaded, setImageLoaded] = useState(() => imageUrl ? LOADED_IMAGES.has(imageUrl) : false);

  const handleLoad = () => {
    if (imageUrl) {
      LOADED_IMAGES.add(imageUrl);
      setImageLoaded(true);
    }
  };

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
      {imageUrl && (
        <div className="w-full h-44 overflow-hidden bg-gray-50 border-b border-gray-100/50 relative">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse transition-opacity duration-500",
            imageLoaded ? "opacity-0" : "opacity-100"
          )} />
          <motion.img 
            initial={false}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            src={imageUrl} 
            alt={article.title}
            onLoad={handleLoad}
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