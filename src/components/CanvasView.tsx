"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSpeed = 0.01;
        const delta = -e.deltaY;
        const newScale = Math.min(Math.max(scale + delta * zoomSpeed, 0.2), 3);
        setScale(newScale);
      } else {
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, x, y]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] cursor-grab active:cursor-grabbing select-none subtle-grid"
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
        Pinch to Zoom • Drag to Pan
      </div>
    </div>
  );
};

export default CanvasView;