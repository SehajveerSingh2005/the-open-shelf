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
  const hasCentered = useRef(false);
  
  const springX = useSpring(x, { damping: 40, stiffness: 200 });
  const springY = useSpring(y, { damping: 40, stiffness: 200 });
  const springScale = useSpring(scale, { damping: 30, stiffness: 150 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (articles.length > 0 && !hasCentered.current) {
      // Find the bounds to calculate the true center
      const minX = Math.min(...articles.map(a => a.x));
      const maxX = Math.max(...articles.map(a => a.x));
      const minY = Math.min(...articles.map(a => a.y));
      const maxY = Math.max(...articles.map(a => a.y));
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Jump to center immediately on first load
      x.jump(-centerX);
      y.jump(-centerY);
      hasCentered.current = true;
    }
  }, [articles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Zoom centered on the cursor or center of screen
        const zoomSpeed = 0.003;
        setScale(prev => {
          const newScale = Math.min(Math.max(prev - e.deltaY * zoomSpeed, 0.2), 2);
          return newScale;
        });
      } else {
        // Simple panning
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
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none cursor-grab active:cursor-grabbing"
    >
      {/* Global Drag Overlay */}
      <motion.div
        drag
        dragMomentum={true}
        onDrag={handleDrag}
        className="absolute inset-[-10000px] z-0"
      />

      <motion.div 
        style={{ x: springX, y: springY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-[-20000px] subtle-grid opacity-30" />
      </motion.div>

      <motion.div
        style={{ 
          x: springX, 
          y: springY, 
          scale: springScale,
          transformOrigin: 'center center' 
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {articles.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto z-10"
            style={{ 
              left: `calc(50% + ${article.x}px)`, 
              top: `calc(50% + ${article.y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <ArticleCard article={article} onClick={onArticleClick} isCanvas />
          </div>
        ))}
      </motion.div>
      
      <div className="absolute bottom-8 left-8 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-gray-100 shadow-sm rounded-full">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-sans">
            Scale: {Math.round(scale * 100)}% • Ctrl+Scroll to Zoom
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;