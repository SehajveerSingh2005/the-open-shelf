"use client";

import React, { useRef, useEffect, useCallback } from 'react';
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
let persistentScale = 0.6;
let isFirstLoad = true;

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  const smoothX = useSpring(x, { damping: 40, stiffness: 200 });
  const smoothY = useSpring(y, { damping: 40, stiffness: 200 });
  const smoothScale = useSpring(scale, { damping: 40, stiffness: 200 });

  // Subtle dot grid parallax
  const bgPosX = useTransform(smoothX, (v) => `${v * 0.1}px`);
  const bgPosY = useTransform(smoothY, (v) => `${v * 0.1}px`);

  useEffect(() => {
    const unsubX = x.on('change', (v) => persistentX = v);
    const unsubY = y.on('change', (v) => persistentY = v);
    const unsubScale = scale.on('change', (v) => persistentScale = v);
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [x, y, scale]);

  const centerCanvas = useCallback((immediate = false) => {
    if (!articles || articles.length === 0) return;
    const allX = articles.map(a => a.x);
    const allY = articles.map(a => a.y);
    const targetX = -(Math.min(...allX) + Math.max(...allX)) / 2;
    const targetY = -(Math.min(...allY) + Math.max(...allY)) / 2;
    
    if (immediate) {
      x.jump(targetX);
      y.jump(targetY);
      scale.jump(0.6);
    } else {
      x.set(targetX);
      y.set(targetY);
      scale.set(0.6);
    }
  }, [articles, x, y, scale]);

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
    const newScale = Math.min(Math.max(currentScale - deltaY * 0.002, 0.1), 2);
    
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
      className="w-full h-full relative overflow-hidden bg-[#f7f7f7] touch-none"
    >
      {/* Refined Dot Grid Background */}
      <motion.div 
        style={{ backgroundPosition: `${bgPosX.get()} ${bgPosY.get()}` }}
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{ 
          backgroundImage: 'radial-gradient(#d1d1d1 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          backgroundPosition: `${bgPosX.get()} ${bgPosY.get()}`
        }}
      />

      {/* Surface for panning */}
      <motion.div
        drag
        dragMomentum={true}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* The Gallery */}
      <motion.div
        style={{ x: smoothX, y: smoothY, scale: smoothScale, transformOrigin: '0 0' }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {articles.map((article) => (
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
      <div className="absolute bottom-8 left-8 pointer-events-none flex items-center space-x-4 z-50">
        <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 border border-gray-200 shadow-xl rounded-full flex items-center space-x-4 pointer-events-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans font-medium">
            Perspective: {Math.round(scale.get() * 100)}%
          </p>
          <div className="h-4 w-px bg-gray-200" />
          <button 
            onClick={() => centerCanvas()}
            className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-gray-900 transition-colors"
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;