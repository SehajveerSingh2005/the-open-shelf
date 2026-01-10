"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

let persistentX = 0;
let persistentY = 0;
let persistentScale = 0.5;
let isFirstLoad = true;

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const lastUpdate = useRef(0);
  
  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  const smoothX = useSpring(x, { damping: 50, stiffness: 250 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 250 });
  const smoothScale = useSpring(scale, { damping: 50, stiffness: 250 });

  // Efficient culling logic with throttling
  const updateVisibility = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastUpdate.current < 100) return; // Limit to 10fps for culling
    lastUpdate.current = now;

    const currentX = -x.get();
    const currentY = -y.get();
    const currentScale = scale.get();
    
    // Calculate a tighter viewport radius to make the "pop up" effect more noticeable
    const viewRadius = (window.innerWidth / currentScale) * 1.1;

    const nextVisible = new Set<string>();
    articles.forEach(article => {
      const dx = article.x - currentX;
      const dy = article.y - currentY;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < viewRadius * viewRadius) {
        nextVisible.add(article.id);
      }
    });

    setVisibleIds(nextVisible);
  }, [articles, x, y, scale]);

  useEffect(() => {
    const unsubX = x.on('change', () => updateVisibility());
    const unsubY = y.on('change', () => updateVisibility());
    const unsubScale = scale.on('change', () => updateVisibility());
    
    updateVisibility(true);
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [x, y, scale, updateVisibility]);

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScale = scale.get();
    const newScale = Math.min(Math.max(currentScale - deltaY * 0.0015, 0.05), 1.5);
    
    if (newScale === currentScale) return;
    const focalX = mouseX - rect.left - rect.width / 2;
    const focalY = mouseY - rect.top - rect.height / 2;
    const worldX = (focalX - x.get()) / currentScale;
    const worldY = (focalY - y.get()) / currentScale;

    scale.set(newScale);
    x.set(focalX - worldX * newScale);
    y.set(focalY - worldY * newScale);
  }, [x, y, scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        handleZoom(e.deltaY, e.clientX, e.clientY);
      } else {
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [x, y, handleZoom]);

  // Pre-filter articles for the render loop
  const renderedArticles = articles.filter(a => visibleIds.has(a.id));

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none"
      style={{
        backgroundImage: 'radial-gradient(#e5e5e5 1.5px, transparent 1.5px)',
        backgroundSize: '80px 80px',
      }}
    >
      <motion.div
        drag
        dragMomentum={true}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      <motion.div
        style={{ 
          x: smoothX, 
          y: smoothY, 
          scale: smoothScale, 
          transformOrigin: '0 0' 
        }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {renderedArticles.map((article) => (
            <motion.div 
              key={article.id} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute pointer-events-auto"
              style={{ 
                left: article.x, 
                top: article.y, 
                transform: 'translate(-50%, -50%)',
                willChange: 'transform, opacity'
              }}
            >
              <ArticleCard article={article} onClick={onArticleClick} isCanvas />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="bg-white/90 backdrop-blur-xl px-6 py-3 border border-gray-200 shadow-2xl rounded-full flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Focal Depth</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(scale.get() * 100)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">In View</span>
            <span className="text-xs font-medium text-gray-900">{visibleIds.size} / {articles.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;