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

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const ticking = useRef(false);
  
  // Calculate content bounds
  const bounds = useMemo(() => {
    if (articles.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const xs = articles.map(a => a.x);
    const ys = articles.map(a => a.y);
    return {
      minX: Math.min(...xs) - 400,
      maxX: Math.max(...xs) + 400,
      minY: Math.min(...ys) - 400,
      maxY: Math.max(...ys) + 400
    };
  }, [articles]);

  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  const smoothX = useSpring(x, { damping: 45, stiffness: 220 });
  const smoothY = useSpring(y, { damping: 45, stiffness: 220 });
  const smoothScale = useSpring(scale, { damping: 45, stiffness: 220 });

  const updateVisibility = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const curX = -x.get();
      const curY = -y.get();
      const s = scale.get();
      
      const width = window.innerWidth / s;
      const height = window.innerHeight / s;
      const margin = 300; 
      
      const left = curX - width / 2 - margin;
      const right = curX + width / 2 + margin;
      const top = curY - height / 2 - margin;
      const bottom = curY + height / 2 + margin;

      const nextVisible = new Set<string>();
      let count = 0;
      const MAX_VISIBLE = 30; // Further reduced for stability during zoom spikes

      // Prioritize items closer to center of view
      const sortedByDistance = [...articles].sort((a, b) => {
        const da = Math.pow(a.x - curX, 2) + Math.pow(a.y - curY, 2);
        const db = Math.pow(b.x - curX, 2) + Math.pow(b.y - curY, 2);
        return da - db;
      });

      for (const art of sortedByDistance) {
        if (art.x > left && art.x < right && art.y > top && art.y < bottom) {
          nextVisible.add(art.id);
          count++;
          if (count >= MAX_VISIBLE) break;
        }
      }

      setVisibleIds(prev => {
        if (prev.size === nextVisible.size) {
          for (const id of nextVisible) if (!prev.has(id)) return nextVisible;
          return prev;
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
    
    const zoomFactor = deltaY > 0 ? 0.94 : 1.06;
    const newScale = Math.min(Math.max(currentScale * zoomFactor, 0.08), 1.1);
    
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
        {/* Dynamic Bounded Grid */}
        <div 
          className="absolute"
          style={{
            left: bounds.minX,
            top: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY,
            backgroundImage: 'radial-gradient(#e5e5e5 1.5px, transparent 1.5px)',
            backgroundSize: '100px 100px',
            opacity: 0.6
          }}
        />

        {renderedList.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto"
            style={{ 
              left: article.x, 
              top: article.y, 
              transform: 'translate(-50%, -50%) translate3d(0,0,0)',
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
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Zoom</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(scale.get() * 100)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Visible</span>
            <span className="text-xs font-medium text-gray-900">{visibleIds.size} / {articles.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;