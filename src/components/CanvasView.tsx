"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
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
  
  const smoothX = useSpring(x, { damping: 50, stiffness: 300 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 300 });
  const smoothScale = useSpring(scale, { damping: 50, stiffness: 300 });

  // Optimized culling logic: No complex animations on exit to save memory/CPU
  const updateVisibility = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastUpdate.current < 50) return; // 20fps for culling checks
    lastUpdate.current = now;

    const currentX = -x.get();
    const currentY = -y.get();
    const s = scale.get();
    
    // Viewport bounds in world space
    const radius = (Math.max(window.innerWidth, window.innerHeight) / s) * 0.8;
    const rSq = radius * radius;

    const nextVisible = new Set<string>();
    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      const dx = art.x - currentX;
      const dy = art.y - currentY;
      if (dx * dx + dy * dy < rSq) {
        nextVisible.add(art.id);
      }
    }

    // Only update state if visibility set has changed
    setVisibleIds(prev => {
      if (prev.size !== nextVisible.size) return nextVisible;
      for (const id of nextVisible) if (!prev.has(id)) return nextVisible;
      return prev;
    });
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
    const newScale = Math.min(Math.max(currentScale - deltaY * 0.001, 0.05), 1.5);
    
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

  // Memoize rendered list to prevent unnecessary re-renders
  const renderedList = useMemo(() => 
    articles.filter(a => visibleIds.has(a.id)), 
    [articles, visibleIds]
  );

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none"
      style={{
        backgroundImage: 'radial-gradient(#e5e5e5 1.5px, transparent 1.5px)',
        backgroundSize: '100px 100px',
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
        {renderedList.map((article) => (
          <motion.div 
            key={article.id} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
      </motion.div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="bg-white/90 backdrop-blur-xl px-6 py-3 border border-gray-200 shadow-2xl rounded-full flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Focal Depth</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(scale.get() * 100)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Active Shelf</span>
            <span className="text-xs font-medium text-gray-900">{visibleIds.size} / {articles.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;