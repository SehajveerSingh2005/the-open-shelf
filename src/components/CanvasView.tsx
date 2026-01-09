"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // World State
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(0.7);
  
  // Smoothness
  const smoothX = useSpring(x, { damping: 40, stiffness: 250 });
  const smoothY = useSpring(y, { damping: 40, stiffness: 250 });
  const smoothScale = useSpring(scale, { damping: 40, stiffness: 250 });

  // Centering Logic
  const centerCanvas = useCallback((immediate = false) => {
    if (articles.length === 0) return;
    
    const minX = Math.min(...articles.map(a => a.x));
    const maxX = Math.max(...articles.map(a => a.x));
    const minY = Math.min(...articles.map(a => a.y));
    const maxY = Math.max(...articles.map(a => a.y));
    
    const targetX = -(minX + maxX) / 2;
    const targetY = -(minY + maxY) / 2;
    
    if (immediate) {
      x.jump(targetX);
      y.jump(targetY);
    } else {
      x.set(targetX);
      y.set(targetY);
    }
  }, [articles, x, y]);

  // Initial center
  useEffect(() => {
    if (articles.length > 0 && x.get() === 0 && y.get() === 0) {
      centerCanvas(true);
    }
  }, [articles.length, centerCanvas, x, y]);

  // Zoom to Mouse Logic
  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentScale = scale.get();
    
    // Calculate new scale
    const zoomSpeed = 0.003;
    const newScale = Math.min(Math.max(currentScale - deltaY * zoomSpeed, 0.1), 2.5);
    
    if (newScale === currentScale) return;

    // To zoom to a focal point, we need to adjust X and Y:
    // 1. Find mouse position relative to container center
    const focalX = mouseX - rect.left - rect.width / 2;
    const focalY = mouseY - rect.top - rect.height / 2;

    // 2. Project focal point into world coordinates
    const worldX = (focalX - x.get()) / currentScale;
    const worldY = (focalY - y.get()) / currentScale;

    // 3. Update scale and adjust X/Y so world coordinates stay at the same focal point
    scale.set(newScale);
    x.set(focalX - worldX * newScale);
    y.set(focalY - worldY * newScale);
  }, [x, y, scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialPinchDistance = 0;
    let initialScale = 1;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        handleZoom(e.deltaY, e.clientX, e.clientY);
      } else {
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        initialScale = scale.get();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const factor = d / initialPinchDistance;
        const newScale = Math.min(Math.max(initialScale * factor, 0.1), 2.5);
        scale.set(newScale);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [x, y, scale, handleZoom]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#fafafa] touch-none"
    >
      {/* Interaction Surface */}
      <motion.div
        drag
        dragMomentum={true}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        className="absolute inset-[-10000px] z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Grid Background */}
      <motion.div 
        style={{ x: smoothX, y: smoothY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-[-20000px] subtle-grid opacity-20" />
      </motion.div>

      {/* The World Container */}
      <motion.div
        style={{ 
          x: smoothX, 
          y: smoothY, 
          scale: smoothScale,
          transformOrigin: '0 0' // Pivot is handled by X/Y adjustments in handleZoom
        }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {articles.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto z-10"
            style={{ 
              left: article.x, 
              top: article.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <ArticleCard 
              article={article} 
              onClick={onArticleClick} 
              isCanvas 
            />
          </div>
        ))}
      </motion.div>
      
      {/* UI Overlay */}
      <div className="absolute bottom-8 left-8 pointer-events-none flex items-center space-x-4">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-gray-100 shadow-sm rounded-full flex items-center space-x-3 pointer-events-auto">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-sans">
            {Math.round(scale.get() * 100)}% Scale
          </p>
          <div className="h-3 w-px bg-gray-100" />
          <button 
            onClick={() => centerCanvas()}
            className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;