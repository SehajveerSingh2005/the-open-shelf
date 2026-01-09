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
  const [scale, setScale] = useState(0.85);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Spring physics for smooth movement
  const springX = useSpring(x, { damping: 40, stiffness: 200 });
  const springY = useSpring(y, { damping: 40, stiffness: 200 });
  const springScale = useSpring(scale, { damping: 30, stiffness: 200 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        setScale(prev => Math.min(Math.max(prev + delta * 0.005, 0.1), 2.5));
      } else {
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
      className="w-full h-full relative overflow-hidden bg-[#fafafa] subtle-grid touch-none"
    >
      {/* Invisible background layer for dragging the whole canvas */}
      <motion.div
        drag
        dragMomentum={false}
        onDrag={(e, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      />

      <motion.div
        style={{ 
          x: springX, 
          y: springY, 
          scale: springScale,
          transformOrigin: 'center center' 
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {articles.map(article => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto z-10"
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
      
      <div className="absolute bottom-8 left-8 flex flex-col space-y-1 bg-white/90 backdrop-blur-sm px-4 py-3 border border-gray-100 shadow-sm z-50 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 font-medium">Controls</p>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">
          Drag background to Pan • Cmd + Scroll to Zoom
        </p>
      </div>
    </div>
  );
};

export default CanvasView;