"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Maximize2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CanvasViewProps {
  articles: {
    items: Article[];
    dimensions: { width: number; height: number };
  };
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera-v4';

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
  
  const rawX = useMotionValue(initialState.x);
  const rawY = useMotionValue(initialState.y);
  const rawScale = useMotionValue(initialState.scale);

  const x = useSpring(rawX, { damping: 45, stiffness: 300 });
  const y = useSpring(rawY, { damping: 45, stiffness: 300 });
  const scale = useSpring(rawScale, { damping: 35, stiffness: 220 });
  
  const [visibleItems, setVisibleItems] = useState<{ article: Article; offset: { x: number; y: number } }[]>([]);
  const [currentScale, setCurrentScale] = useState(initialState.scale);
  const lastUpdateBlock = useRef({ x: -999, y: -999 });

  const updateVisibility = useCallback((force = false) => {
    const s = rawScale.get();
    const curX = rawX.get();
    const curY = rawY.get();
    const { width, height } = articles.dimensions;
    if (width === 0 || height === 0) return;

    // Calculate which "block" the viewport center is in
    const blockX = Math.floor(-curX / width);
    const blockY = Math.floor(-curY / height);

    // Only update the state if we've crossed a block boundary or changed zoom significantly
    if (!force && blockX === lastUpdateBlock.current.x && blockY === lastUpdateBlock.current.y) {
      return;
    }

    lastUpdateBlock.current = { x: blockX, y: blockY };
    setCurrentScale(s);
    
    const nextVisible: { article: Article; offset: { x: number; y: number } }[] = [];

    // Render a 3x3 grid of blocks around the current center block
    // This provides a massive buffer so cards never "pop in" while in view
    for (let bx = blockX - 1; bx <= blockX + 1; bx++) {
      for (let by = blockY - 1; by <= blockY + 1; by++) {
        const offsetX = bx * width;
        const offsetY = by * height;

        for (const art of articles.items) {
          nextVisible.push({ article: art, offset: { x: offsetX, y: offsetY } });
        }
      }
    }
    
    setVisibleItems(nextVisible);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: curX, y: curY, scale: s }));
  }, [articles, rawX, rawY, rawScale]);

  useEffect(() => {
    const unsubX = rawX.on('change', () => updateVisibility());
    const unsubY = rawY.on('change', () => updateVisibility());
    const unsubScale = rawScale.on('change', () => updateVisibility());
    
    updateVisibility(true);
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [rawX, rawY, rawScale, updateVisibility]);

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const s = rawScale.get();
    
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(s * zoomFactor, 0.15), 2.0);
    
    if (newScale === s) return;

    const focalX = mouseX - rect.left - rect.width / 2;
    const focalY = mouseY - rect.top - rect.height / 2;
    const worldX = (focalX - rawX.get()) / s;
    const worldY = (focalY - rawY.get()) / s;

    rawX.set(focalX - worldX * newScale);
    rawY.set(focalY - worldY * newScale);
    rawScale.set(newScale);
  }, [rawX, rawY, rawScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        handleZoom(e.deltaY, e.clientX, e.clientY);
      } else {
        rawX.set(rawX.get() - e.deltaX);
        rawY.set(rawY.get() - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [rawX, rawY, handleZoom]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background touch-none cursor-grab active:cursor-grabbing"
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#000 1.5px, transparent 1.5px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: useTransform([x, y], ([bx, by]) => `calc(50% + ${bx}px) calc(50% + ${by}px)`)
        }}
      />

      <motion.div
        style={{ x, y, scale }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {visibleItems.map(({ article, offset }, idx) => (
          <div 
            key={`${article.id}-${offset.x}-${offset.y}`} 
            className="absolute pointer-events-auto"
            style={{ 
              left: article.x + offset.x, 
              top: article.y + offset.y, 
              transform: 'translate(-50%, -50%)',
              willChange: 'transform'
            }}
          >
            <div className={cn(currentScale < 0.4 ? "scale-reduced" : "")}>
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
        <div className="bg-white/90 backdrop-blur-xl px-6 py-3 border border-gray-100 shadow-2xl rounded-none flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Zoom</span>
            <span className="text-xs font-medium text-gray-900">{Math.round(currentScale * 100)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <button 
            onClick={() => { rawX.set(0); rawY.set(0); rawScale.set(0.85); }}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Maximize2 size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;