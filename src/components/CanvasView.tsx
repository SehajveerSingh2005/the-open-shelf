"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Maximize2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera-v4';

const getStoredState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const x = parseFloat(parsed.x);
      const y = parseFloat(parsed.y);
      const scale = parseFloat(parsed.scale);
      if (!isNaN(x) && !isNaN(y) && !isNaN(scale)) {
        return { x, y, scale };
      }
    }
  } catch (e) {}
  return { x: 0, y: 0, scale: 0.85 };
};

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialState = useMemo(() => getStoredState(), []);
  
  const rawX = useMotionValue(initialState.x);
  const rawY = useMotionValue(initialState.y);
  const rawScale = useMotionValue(initialState.scale);

  // Smooth springs for camera movement
  const x = useSpring(rawX, { damping: 50, stiffness: 400 });
  const y = useSpring(rawY, { damping: 50, stiffness: 400 });
  const scale = useSpring(rawScale, { damping: 40, stiffness: 300 });
  
  const [currentScale, setCurrentScale] = useState(initialState.scale);

  const bgX = useTransform(x, (v) => `${v}px`);
  const bgY = useTransform(y, (v) => `${v}px`);

  const saveState = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      x: rawX.get(),
      y: rawY.get(),
      scale: rawScale.get()
    }));
  }, [rawX, rawY, rawScale]);

  useEffect(() => {
    const unsubX = rawX.on('change', saveState);
    const unsubY = rawY.on('change', saveState);
    const unsubScale = rawScale.on('change', (s) => {
      setCurrentScale(s);
      saveState();
    });
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [rawX, rawY, rawScale, saveState]);

  const resetView = () => {
    rawX.set(0);
    rawY.set(0);
    rawScale.set(0.85);
  };

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const s = rawScale.get();
    
    const zoomFactor = deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.min(Math.max(s * zoomFactor, 0.15), 3);
    
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
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none cursor-grab active:cursor-grabbing"
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(#000 1.5px, transparent 1.5px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: useTransform([bgX, bgY], ([bx, by]) => `calc(50% + ${bx}) calc(50% + ${by})`)
        }}
      />

      {/* The shelf container */}
      <motion.div
        style={{ x, y, scale }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {/* We now render all articles without visibility-based unmounting to prevent glitches */}
        {articles.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto"
            style={{ 
              left: article.x, 
              top: article.y, 
              transform: 'translate(-50%, -50%)',
              willChange: 'transform' // Helps GPU acceleration for stable panning
            }}
          >
            <div className={cn(currentScale < 0.5 ? "scale-reduced" : "")}>
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
        <div className="bg-white/90 backdrop-blur-xl px-6 py-3 border border-gray-200 shadow-2xl rounded-full flex items-center space-x-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Zoom</span>
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