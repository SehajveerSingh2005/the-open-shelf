"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

// Higher default zoom for immediate readability
let persistentX = 0;
let persistentY = 0;
let persistentScale = 0.85; 

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const ticking = useRef(false);
  
  const bounds = useMemo(() => {
    if (articles.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const xs = articles.map(a => a.x);
    const ys = articles.map(a => a.y);
    return {
      minX: Math.min(...xs) - 600,
      maxX: Math.max(...xs) + 600,
      minY: Math.min(...ys) - 600,
      maxY: Math.max(...ys) + 600
    };
  }, [articles]);

  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  const smoothX = useSpring(x, { damping: 50, stiffness: 250 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 250 });
  const smoothScale = useSpring(scale, { damping: 50, stiffness: 250 });

  // Pure Viewport-Based Visibility (No arbitrary caps)
  const updateVisibility = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const curX = -x.get();
      const curY = -y.get();
      const s = scale.get();
      
      const width = window.innerWidth / s;
      const height = window.innerHeight / s;
      
      // Calculate viewport in world space
      const left = curX - width / 2 - 400; // 400px buffer
      const right = curX + width / 2 + 400;
      const top = curY - height / 2 - 400;
      const bottom = curY + height / 2 + 400;

      const nextVisible = new Set<string>();
      for (let i = 0; i < articles.length; i++) {
        const art = articles[i];
        if (art.x > left && art.x < right && art.y > top && art.y < bottom) {
          nextVisible.add(art.id);
        }
      }

      setVisibleIds(prev => {
        if (prev.size === nextVisible.size) {
          let hasChanged = false;
          for (const id of nextVisible) {
            if (!prev.has(id)) { hasChanged = true; break; }
          }
          if (!hasChanged) return prev;
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
    
    // Smooth zoom transition
    const zoomFactor = deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.min(Math.max(currentScale * zoomFactor, 0.15), 1.5);
    
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
      <motion.div
        style={{ 
          x: smoothX, 
          y: smoothY, 
          scale: smoothScale, 
          transformOrigin: '0 0' 
        }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        <div 
          className="absolute"
          style={{
            left: bounds.minX,
            top: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY,
            backgroundImage: 'radial-gradient(#e2e2e2 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px',
            opacity: 0.5
          }}
        />

        {renderedList.map((article) => (
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
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="bg-white/90 backdrop-blur-xl px-6 py-3 border border-gray-200 shadow-2xl rounded-full flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Focal Depth</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(scale.get() * 100)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Visible</span>
            <span className="text-xs font-medium text-gray-900">{visibleIds.size} articles</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;