"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, PanInfo } from 'framer-motion';
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
  
  const springX = useSpring(x, { damping: 45, stiffness: 240 });
  const springY = useSpring(y, { damping: 45, stiffness: 240 });
  const springScale = useSpring(scale, { damping: 35, stiffness: 220 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        setScale(prev => Math.min(Math.max(prev + delta * 0.005, 0.15), 2));
      } else {
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleDrag = (event: any, info: PanInfo) => {
    x.set(x.get() + info.delta.x);
    y.set(y.get() + info.delta.y);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none cursor-grab active:cursor-grabbing"
    >
      {/* Background with infinite grid effect */}
      <motion.div 
        style={{ x: springX, y: springY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div 
          className="absolute inset-[-10000px] subtle-grid" 
          style={{ opacity: 0.5 }}
        />
      </motion.div>

      <motion.div
        drag
        dragMomentum={true}
        dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
        onDrag={handleDrag}
        className="absolute inset-0 z-0"
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
        {articles.map((article, index) => {
          // Add small organic jitters to the database positions to make it feel less "grid-like"
          const offsetX = (index % 3 - 1) * 20;
          const offsetY = (index % 2 === 0 ? 1 : -1) * 30;
          
          return (
            <div 
              key={article.id} 
              className="absolute pointer-events-auto z-10"
              style={{ 
                left: `calc(50% + ${article.x + offsetX}px)`, 
                top: `calc(50% + ${article.y + offsetY}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <ArticleCard 
                article={article} 
                onClick={onArticleClick} 
                isCanvas
              />
            </div>
          );
        })}
      </motion.div>
      
      <div className="absolute top-24 right-8 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 border border-gray-100 shadow-sm z-50 rounded-full">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-sans">Live Canvas</p>
      </div>
    </div>
  );
};

export default CanvasView;