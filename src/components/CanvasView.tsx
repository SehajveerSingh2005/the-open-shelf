"use client";

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const [scale, setScale] = useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * delta, 0.2), 2));
    } else {
      x.set(x.get() - e.deltaX);
      y.set(y.get() - e.deltaY);
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-[#fafafa] cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      style={{
        backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <motion.div
        drag
        dragMomentum={false}
        style={{ x, y, scale }}
        className="w-full h-full absolute"
      >
        {articles.map(article => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            isCanvas 
            onClick={onArticleClick} 
          />
        ))}
      </motion.div>
      
      <div className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 text-[10px] font-sans text-gray-400 uppercase tracking-widest pointer-events-none">
        Cmd + Scroll to Zoom • Drag to Pan
      </div>
    </div>
  );
};

export default CanvasView;