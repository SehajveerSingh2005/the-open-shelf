"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

// Persist camera state globally
let persistentX = 0;
let persistentY = 0;
let persistentScale = 0.5;
let isFirstLoad = true;

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleArticles, setVisibleArticles] = useState<Article[]>([]);
  
  // Camera State
  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  const smoothX = useSpring(x, { damping: 50, stiffness: 250 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 250 });
  const smoothScale = useSpring(scale, { damping: 50, stiffness: 250 });

  // Radial Culling Logic: Only render items near the focal point
  const updateVisibility = useCallback(() => {
    const currentX = -x.get(); // Camera position is inverted world space
    const currentY = -y.get();
    const currentScale = scale.get();
    
    // Threshold radius depends on zoom level (further zoom = see more)
    const viewRadius = (window.innerWidth / currentScale) * 1.5;

    const filtered = articles.filter(article => {
      const dx = article.x - currentX;
      const dy = article.y - currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < viewRadius;
    });

    setVisibleArticles(filtered);
  }, [articles, x, y, scale]);

  // Sync back to persistence and trigger culling
  useEffect(() => {
    const unsubX = x.on('change', (v) => { persistentX = v; updateVisibility(); });
    const unsubY = y.on('change', (v) => { persistentY = v; updateVisibility(); });
    const unsubScale = scale.on('change', (v) => { persistentScale = v; updateVisibility(); });
    
    updateVisibility(); // Initial check
    
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [x, y, scale, updateVisibility]);

  const centerCanvas = useCallback((immediate = false) => {
    if (immediate) {
      x.jump(0); y.jump(0); scale.jump(0.5);
    } else {
      x.set(0); y.set(0); scale.set(0.5);
    }
  }, [x, y, scale]);

  useEffect(() => {
    if (isFirstLoad && articles.length > 0) {
      centerCanvas(true);
      isFirstLoad = false;
    }
  }, [articles.length, centerCanvas]);

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScale = scale.get();
    const newScale = Math.min(Math.max(currentScale - deltaY * 0.0015, 0.05), 2);
    
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

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none"
      style={{
        backgroundImage: 'radial-gradient(#e5e5e5 1.5px, transparent 1.5px)',
        backgroundSize: '60px 60px',
      }}
    >
      {/* Pan Surface */}
      <motion.div
        drag
        dragMomentum={true}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* World Container */}
      <motion.div
        style={{ 
          x: smoothX, 
          y: smoothY, 
          scale: smoothScale, 
          transformOrigin: '0 0' 
        }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {visibleArticles.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto"
            style={{ 
              left: article.x, 
              top: article.y, 
              transform: 'translate(-50%, -50%)',
              willChange: 'transform'
            }}
          >
            <ArticleCard article={article} onClick={onArticleClick} isCanvas />
          </div>
        ))}
      </motion.div>
      
      {/* HUD */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="bg-white/90 backdrop-blur-xl px-6 py-3 border border-gray-200 shadow-2xl rounded-full flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Focal Depth</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(scale.get() * 100)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Visible</span>
            <span className="text-xs font-medium text-gray-900">{visibleArticles.length} / {articles.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <button 
            onClick={() => centerCanvas()}
            className="text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-gray-900 transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;