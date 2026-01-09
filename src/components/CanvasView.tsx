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
  const [scale, setScale] = useState(0.85);
  // Start centered at 0,0
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { damping: 40, stiffness: 200 });
  const springY = useSpring(y, { damping: 40, stiffness: 200 });
  const springScale = useSpring(scale, { damping: 30, stiffness: 150 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        setScale(prev => Math.min(Math.max(prev + delta * 0.005, 0.2), 2));
      } else {
        // Simple panning with wheel
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleDrag = (_: any, info: PanInfo) => {
    x.set(x.get() + info.delta.x);
    y.set(y.get() + info.delta.y);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none"
    >
      {/* Draggable Surface - covers the whole area to prevent dead zones */}
      <motion.div
        drag
        dragMomentum={true}
        dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
        onDrag={handleDrag}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Grid Layer */}
      <motion.div 
        style={{ x: springX, y: springY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div 
          className="absolute inset-[-20000px] subtle-grid" 
          style={{ opacity: 0.4 }}
        />
      </motion.div>

      {/* Content Layer */}
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
          // Subtle organic offset
          const offsetX = (index % 5 - 2) * 15;
          const offsetY = (index % 3 - 1) * 25;
          
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
      
      <div className="absolute bottom-8 right-8 flex flex-col items-end space-y-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-gray-100 shadow-sm rounded-full flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-sans">
            {Math.round(scale * 100)}% View
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;