"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Maximize2 } from 'lucide-react';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera';
const getStoredState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 0.85 };
  } catch {
    return { x: 0, y: 0, scale: 0.85 };
  }
};

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialState = useMemo(() => getStoredState(), []);
  
  const x = useMotionValue(initialState.x);
  const y = useMotionValue(initialState.y);
  const scale = useMotionValue(initialState.scale);
  
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const ticking = useRef(false);

  const smoothX = useSpring(x, { damping: 50, stiffness: 300 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 300 });
  const smoothScale = useSpring(scale, { damping: 50, stiffness: 300 });

  // Performance-friendly background positions
  const bgX = useTransform(smoothX, (v) => `${v}px`);
  const bgY = useTransform(smoothY, (v) => `${v}px`);

  // Debounced save to localStorage
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const save = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          x: x.get(),
          y: y.get(),
          scale: scale.get()
        }));
      }, 500);
    };
    const unsubX = x.on('change', save);
    const unsubY = y.on('change', save);
    const unsubScale = scale.on('change', save);
    return () => { 
      unsubX(); unsubY(); unsubScale(); 
      clearTimeout(timeout);
    };
  }, [x, y, scale]);

  const updateVisibility = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const curX = -x.get();
      const curY = -y.get();
      const s = scale.get();
      const width = window.innerWidth / s;
      const height = window.innerHeight / s;
      
      const padding = 1000;
      const left = curX - width / 2 - padding;
      const right = curX + width / 2 + padding;
      const top = curY - height / 2 - padding;
      const bottom = curY + height / 2 + padding;

      const nextVisible = new Set<string>();
      for (const art of articles) {
        if (art.x > left && art.x < right && art.y > top && art.y < bottom) {
          nextVisible.add(art.id);
        }
      }
      setVisibleIds(nextVisible);
      ticking.current = false;
    });
  }, [articles, x, y, scale]);

  useEffect(() => {
    const unsubX = x.on('change', updateVisibility);
    const unsubY = y.on('change', updateVisibility);
    const unsubScale = scale.on('change', updateVisibility);
    updateVisibility();
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [x, y, scale, updateVisibility]);

  const resetView = () => {
    x.set(0);
    y.set(0);
    scale.set(0.85);
  };

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScale = scale.get();
    const zoomFactor = deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.min(Math.max(currentScale * zoomFactor, 0.1), 1.5);
    
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
      {/* 
          Performant Background Grid 
          Using background-position instead of a massive inset layer for Firefox stability
      */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#e2e2e2 1.5px, transparent 1.5px)',
          backgroundSize: useTransform(smoothScale, s => `${80 * s}px ${80 * s}px`),
          backgroundPosition: useTransform([bgX, bgY], ([bx, by]) => `calc(50% + ${bx}) calc(50% + ${by})`),
          opacity: 0.5
        }}
      />

      <motion.div
        style={{ x: smoothX, y: smoothY, scale: smoothScale, transformOrigin: '0 0' }}
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
          
          <button 
            onClick={resetView}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Maximize2 size={14} />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;