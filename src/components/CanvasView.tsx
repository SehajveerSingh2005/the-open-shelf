"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, PanInfo } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Plus, Minus, Maximize } from 'lucide-react';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const [scale, setScale] = useState(0.85);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Ref to track if we've already performed the initial centering
  const hasCentered = useRef(false);
  
  const springX = useSpring(x, { damping: 40, stiffness: 200 });
  const springY = useSpring(y, { damping: 40, stiffness: 200 });
  const springScale = useSpring(scale, { damping: 30, stiffness: 150 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Center the canvas ONLY on the very first load
  useEffect(() => {
    if (articles.length > 0 && !hasCentered.current) {
      const avgX = articles.reduce((acc, art) => acc + art.x, 0) / articles.length;
      const avgY = articles.reduce((acc, art) => acc + art.y, 0) / articles.length;
      
      // We set them directly to avoid the "rushing in" effect on first mount
      // and let the spring take over for future movements
      x.jump(-avgX);
      y.jump(-avgY);
      
      hasCentered.current = true;
    }
  }, [articles.length]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Zoom logic
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        setScale(prev => Math.min(Math.max(prev + delta * 0.005, 0.15), 2.5));
      } else {
        // Normal panning
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

  const resetPosition = () => {
    if (articles.length > 0) {
      const avgX = articles.reduce((acc, art) => acc + art.x, 0) / articles.length;
      const avgY = articles.reduce((acc, art) => acc + art.y, 0) / articles.length;
      x.set(-avgX);
      y.set(-avgY);
      setScale(0.85);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none cursor-grab active:cursor-grabbing"
    >
      {/* Invisible drag surface that covers everything */}
      <motion.div
        drag
        dragMomentum={true}
        dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
        onDrag={handleDrag}
        className="absolute inset-[-10000px] z-0"
      >
        <div 
          className="absolute inset-0 subtle-grid pointer-events-none" 
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
            <ArticleCard 
              article={article} 
              onClick={onArticleClick} 
              isCanvas
            />
          </div>
        ))}
      </motion.div>
      
      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col space-y-3 pointer-events-none">
        <div className="flex flex-col bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm pointer-events-auto overflow-hidden">
          <button 
            onClick={() => setScale(s => Math.min(s + 0.2, 2.5))}
            className="p-3 text-gray-400 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={() => setScale(s => Math.max(s - 0.2, 0.15))}
            className="p-3 text-gray-400 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={resetPosition}
            className="p-3 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <Maximize size={16} />
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-gray-100 shadow-sm rounded-full flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-sans">
            {Math.round(scale * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;