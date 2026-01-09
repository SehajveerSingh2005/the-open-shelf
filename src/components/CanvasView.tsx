"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const [scale, setScale] = useState(0.8);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { damping: 30, stiffness: 200 });
  const springY = useSpring(y, { damping: 30, stiffness: 200 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSpeed = 0.005;
        const delta = -e.deltaY;
        setScale(prev => Math.min(Math.max(prev + delta * zoomSpeed, 0.1), 2));
      } else {
        // Standard scrolling pans the canvas
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] cursor-grab active:cursor-grabbing select-none subtle-grid"
    >
      <motion.div
        drag
        dragMomentum={false}
        style={{ 
          x: springX, 
          y: springY, 
          scale,
          transformOrigin: 'center center' 
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {articles.map(article => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto"
            style={{ 
              left: `calc(50% + ${article.x}px)`, 
              top: `calc(50% + ${article.y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <ArticleCard 
              article={article} 
              onClick={onArticleClick} 
            />
          </div>
        ))}
      </motion.div>
      
      <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-sm px-4 py-2 border border-gray-100 text-[10px] uppercase tracking-widest text-gray-400 font-sans pointer-events-none">
        Scroll to Pan • Cmd + Scroll to Zoom
      </div>
    </div>
  );
};

export default CanvasView;