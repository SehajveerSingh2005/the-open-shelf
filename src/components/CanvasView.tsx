"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

// Global camera state persistence
let persistentX = 0;
let persistentY = 0;
let persistentScale = 0.5;
let isFirstLoad = true;

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera State
  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  // High-performance smooth motion
  const smoothX = useSpring(x, { damping: 50, stiffness: 200 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 200 });
  const smoothScale = useSpring(scale, { damping: 50, stiffness: 200 });

  // Background Parallax
  const bgX = useTransform(smoothX, (v) => v * 0.2);
  const bgY = useTransform(smoothY, (v) => v * 0.2);

  // Persistence Sync
  useEffect(() => {
    const unsubX = x.on('change', (v) => persistentX = v);
    const unsubY = y.on('change', (v) => persistentY = v);
    const unsubScale = scale.on('change', (v) => persistentScale = v);
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [x, y, scale]);

  const centerCanvas = useCallback((immediate = false) => {
    if (articles.length === 0) return;
    const allX = articles.map(a => a.x);
    const allY = articles.map(a => a.y);
    const targetX = -(Math.min(...allX) + Math.max(...allX)) / 2;
    const targetY = -(Math.min(...allY) + Math.max(...allY)) / 2;
    
    if (immediate) {
      x.jump(targetX);
      y.jump(targetY);
      scale.jump(0.5);
    } else {
      x.set(targetX);
      y.set(targetY);
      scale.set(0.5);
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
    const newScale = Math.min(Math.max(currentScale - deltaY * 0.003, 0.05), 3);
    
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
      className="w-full h-full relative overflow-hidden bg-[#0a0a0a] touch-none"
    >
      {/* Dynamic Background: 3 Layers of Space */}
      <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0 pointer-events-none">
        {/* Distant Stars */}
        <div className="absolute inset-[-10000px] opacity-20" 
          style={{ backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)', backgroundSize: '150px 150px' }} 
        />
        {/* Medium Stars */}
        <div className="absolute inset-[-10000px] opacity-10" 
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '400px 400px' }} 
        />
        {/* Subtle Cosmic Dust */}
        <div className="absolute inset-[-10000px] opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent" />
      </motion.div>

      {/* Interaction Layer */}
      <motion.div
        drag
        dragMomentum={true}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        className="absolute inset-[-10000px] z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Content Layer */}
      <motion.div
        style={{ x: smoothX, y: smoothY, scale: smoothScale, transformOrigin: '0 0' }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {articles.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto"
            style={{ left: article.x, top: article.y, transform: 'translate(-50%, -50%)' }}
          >
            <ArticleCard article={article} onClick={onArticleClick} isCanvas />
          </div>
        ))}
      </motion.div>
      
      {/* Persistent UI Controls */}
      <div className="absolute bottom-8 left-8 pointer-events-none flex items-center space-x-4 z-50">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 border border-white/10 shadow-2xl rounded-full flex items-center space-x-3 pointer-events-auto">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-sans">
            {Math.round(scale.get() * 100)}% Distance
          </p>
          <div className="h-3 w-px bg-white/10" />
          <button 
            onClick={() => centerCanvas()}
            className="text-[9px] uppercase tracking-widest text-gray-300 hover:text-white transition-colors"
          >
            Reset Perspective
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;