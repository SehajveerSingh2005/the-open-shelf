"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Maximize2 } from 'lucide-react';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera';
const MAX_VISIBLE_ITEMS = 40; // Hard limit for Firefox stability

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
  const [currentScale, setCurrentScale] = useState(initialState.scale);
  const ticking = useRef(false);

  // Throttled visibility check
  const updateVisibility = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const s = scale.get();
      const curX = -x.get();
      const curY = -y.get();
      setCurrentScale(s);
      
      const width = window.innerWidth / s;
      const height = window.innerHeight / s;
      
      // Viewing frustum with some padding
      const padding = 500;
      const left = curX - width / 2 - padding;
      const right = curX + width / 2 + padding;
      const top = curY - height / 2 - padding;
      const bottom = curY + height / 2 + padding;

      const nextVisible = new Set<string>();
      let count = 0;

      for (const art of articles) {
        if (count >= MAX_VISIBLE_ITEMS) break;
        if (art.x > left && art.x < right && art.y > top && art.y < bottom) {
          nextVisible.add(art.id);
          count++;
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

  // Persist state with debounce
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
      }, 1000);
    };
    const unsub = scale.on('change', save);
    return () => { unsub(); clearTimeout(timeout); };
  }, [x, y, scale]);

  const resetView = () => {
    x.set(0);
    y.set(0);
    scale.set(0.85);
  };

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const s = scale.get();
    
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(s * zoomFactor, 0.15), 1.2);
    
    if (newScale === s) return;

    const focalX = mouseX - rect.left - rect.width / 2;
    const focalY = mouseY - rect.top - rect.height / 2;
    
    const worldX = (focalX - x.get()) / s;
    const worldY = (focalY - y.get()) / s;

    x.set(focalX - worldX * newScale);
    y.set(focalY - worldY * newScale);
    scale.set(newScale);
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
      {/* Static grid background - No motion values here for Firefox stability */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        style={{ x, y, scale }}
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
              // Simplified card visibility at low zoom
              opacity: currentScale < 0.2 ? 0.5 : 1,
              willChange: 'transform'
            }}
          >
            {/* Pass current scale to implement Level of Detail in Card */}
            <div className={cn(currentScale < 0.3 ? "scale-reduced" : "")}>
              <ArticleCard 
                article={article} 
                onClick={onArticleClick} 
                isCanvas 
              />
            </div>
          </div>
        ))}
      </motion.div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="bg-white/95 backdrop-blur-md px-6 py-3 border border-gray-200 shadow-xl rounded-full flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Focal Depth</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(currentScale * 100)}%</span>
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