"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

// Persist camera state to avoid jumps on view switch
let persistentX = 0;
let persistentY = 0;
let persistentScale = 0.5;

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const ticking = useRef(false);
  
  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  // High-performance springs
  const smoothX = useSpring(x, { damping: 40, stiffness: 200 });
  const smoothY = useSpring(y, { damping: 40, stiffness: 200 });
  const smoothScale = useSpring(scale, { damping: 40, stiffness: 200 });

  // Aggressive Culling Logic
  const updateVisibility = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const curX = -x.get();
      const curY = -y.get();
      const s = scale.get();
      
      // Viewport bounds calculation
      const width = window.innerWidth / s;
      const height = window.innerHeight / s;
      const margin = 500; // Buffer for smooth entry
      
      const left = curX - width / 2 - margin;
      const right = curX + width / 2 + margin;
      const top = curY - height / 2 - margin;
      const bottom = curY + height / 2 + margin;

      const nextVisible = new Set<string>();
      let count = 0;
      const MAX_VISIBLE = 40; // Hard cap on rendered components for performance

      for (let i = 0; i < articles.length; i++) {
        const art = articles[i];
        if (art.x > left && art.x < right && art.y > top && art.y < bottom) {
          nextVisible.add(art.id);
          count++;
          if (count >= MAX_VISIBLE) break; // Don't overwhelm the DOM
        }
      }

      setVisibleIds(prev => {
        if (prev.size === nextVisible.size) {
          let identical = true;
          for (const id of nextVisible) if (!prev.has(id)) { identical = false; break; }
          if (identical) return prev;
        }
        return nextVisible;
      });
      
      ticking.current = false;
    });
  }, [articles, x, y, scale]);

  useEffect(() => {
    const unsubX = x.on('change', (v) => { persistentX = v; updateVisibility(); });
    const unsubY = y.on('change', (v) => { persistentY = v; updateVisibility(); });
    const unsubScale = scale.on('change', (v) => { persistentScale = v; updateVisibility(); });
    
    updateVisibility();
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [x, y, scale, updateVisibility]);

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScale = scale.get();
    
    // Snappier zoom steps
    const zoomFactor = deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.min(Math.max(currentScale * zoomFactor, 0.05), 1.2);
    
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

  const renderedList = useMemo(() => 
    articles.filter(a => visibleIds.has(a.id)), 
    [articles, visibleIds]
  );

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none cursor-grab active:cursor-grabbing"
    >
      {/* Grid Layer */}
      <motion.div 
        className="absolute inset-[-200%] pointer-events-none"
        style={{ 
          x: smoothX, 
          y: smoothY, 
          scale: smoothScale,
          backgroundImage: 'radial-gradient(#e5e5e5 1.5px, transparent 1.5px)',
          backgroundSize: '100px 100px',
        }}
      />

      {/* World Layer */}
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
          <div 
            key={article.id} 
            className="absolute pointer-events-auto"
            style={{ 
              left: article.x, 
              top: article.y, 
              transform: 'translate(-50%, -50%)',
              willChange: 'transform' // Hardware acceleration
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
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Active Shelf</span>
            <span className="text-xs font-medium text-gray-900">{visibleIds.size} / {articles.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;