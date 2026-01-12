"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CanvasViewProps {
  articles: {
    items: Article[];
    dimensions: { width: number; height: number };
  };
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera-v7';

const getStoredState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 0.9 };
  } catch {
    return { x: 0, y: 0, scale: 0.9 };
  }
};

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialState = useMemo(() => getStoredState(), []);
  
  const rawX = useMotionValue(initialState.x);
  const rawY = useMotionValue(initialState.y);
  const rawScale = useMotionValue(initialState.scale);

  // Smoother, less bouncy physics settings
  const x = useSpring(rawX, { damping: 60, stiffness: 450, mass: 1 });
  const y = useSpring(rawY, { damping: 60, stiffness: 450, mass: 1 });
  const scale = useSpring(rawScale, { damping: 45, stiffness: 350 });
  
  const [visibleItems, setVisibleItems] = useState<{ article: Article; offset: { x: number; y: number } }[]>([]);
  const [currentScale, setCurrentScale] = useState(initialState.scale);
  const lastUpdatePos = useRef({ x: -9999, y: -9999 });

  const updateVisibility = useCallback((force = false) => {
    const s = rawScale.get();
    const curX = rawX.get();
    const curY = rawY.get();
    const { width, height } = articles.dimensions;
    if (width === 0 || height === 0) return;

    // Only update DOM if we've moved more than 200px to reduce lag
    const dist = Math.sqrt(Math.pow(curX - lastUpdatePos.current.x, 2) + Math.pow(curY - lastUpdatePos.current.y, 2));
    if (!force && dist < 200 && Math.abs(s - currentScale) < 0.05) {
      return;
    }

    lastUpdatePos.current = { x: curX, y: curY };
    setCurrentScale(s);
    
    const blockX = Math.floor(-curX / width);
    const blockY = Math.floor(-curY / height);

    const nextVisible: { article: Article; offset: { x: number; y: number } }[] = [];

    // Render a larger 5x5 grid buffer to ensure cards are pre-rendered far ahead
    for (let bx = blockX - 2; bx <= blockX + 2; bx++) {
      for (let by = blockY - 2; by <= blockY + 2; by++) {
        const offsetX = bx * width;
        const offsetY = by * height;
        for (const art of articles.items) {
          nextVisible.push({ article: art, offset: { x: offsetX, y: offsetY } });
        }
      }
    }
    
    setVisibleItems(nextVisible);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: curX, y: curY, scale: s }));
  }, [articles, rawX, rawY, rawScale, currentScale]);

  useEffect(() => {
    const unsubX = rawX.on('change', () => updateVisibility());
    const unsubY = rawY.on('change', () => updateVisibility());
    const unsubScale = rawScale.on('change', () => {
      setCurrentScale(rawScale.get());
      updateVisibility();
    });
    
    updateVisibility(true);
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [rawX, rawY, rawScale, updateVisibility]);

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const s = rawScale.get();
    
    const zoomFactor = deltaY > 0 ? 0.94 : 1.06;
    const newScale = Math.min(Math.max(s * zoomFactor, 0.6), 1.2);
    
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

  const resetView = () => {
    rawX.set(0);
    rawY.set(0);
    rawScale.set(0.9);
  };

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
        {visibleItems.map(({ article, offset }) => (
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
            <div className={cn(currentScale < 0.75 ? "scale-reduced" : "")}>
              <ArticleCard 
                article={article} 
                onClick={onArticleClick} 
                isCanvas 
              />
            </div>
          </div>
        ))}
      </motion.div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-xl px-6 py-4 border border-gray-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-full flex items-center space-x-8 pointer-events-auto"
        >
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleZoom(1, window.innerWidth/2, window.innerHeight/2)}
              className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[10px] font-sans font-bold text-gray-900">{Math.round(currentScale * 100)}%</span>
            </div>
            <button 
              onClick={() => handleZoom(-1, window.innerWidth/2, window.innerHeight/2)}
              className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <div className="h-4 w-px bg-gray-200/50" />
          <button 
            onClick={resetView}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-gray-400 hover:text-gray-900 transition-colors"
          >
            <Maximize2 size={14} />
            <span>Reset</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CanvasView;