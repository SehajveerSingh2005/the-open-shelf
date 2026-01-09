World' transformation model with native gesture support and improved centering.">
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
  const scale = useMotionValue(0.8);
  
  // Smoothness
  const smoothX = useSpring(x, { damping: 30, stiffness: 200 });
  const smoothY = useSpring(y, { damping: 30, stiffness: 200 });
  const smoothScale = useSpring(scale, { damping: 30, stiffness: 200 });

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

  // Initial center on first mount with articles
  useEffect(() => {
    if (articles.length > 0 && x.get() === 0 && y.get() === 0) {
      centerCanvas(true);
    }
  }, [articles.length, centerCanvas, x, y]);

  // Gesture & Wheel Handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialPinchDistance = 0;
    let initialScale = 1;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomSpeed = 0.005;
        const newScale = Math.min(Math.max(scale.get() - e.deltaY * zoomSpeed, 0.15), 2.5);
        scale.set(newScale);
      } else {
        // Pan
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        initialPinchDistance = d;
        initialScale = scale.get();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger pan is handled by framer-motion drag if we wanted, 
        // but we'll stick to a global surface for simplicity.
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const d = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const factor = d / initialPinchDistance;
        scale.set(Math.min(Math.max(initialScale * factor, 0.15), 2.5));
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
  }, [x, y, scale]);

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
          transformOrigin: 'center center' 
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {articles.map((article) => (
          <div 
            key={article.id} 
            className="absolute pointer-events-auto z-10"
            style={{ 
              left: `calc(50% + ${article.x}px)`, 
              top: `calc(50% + ${article.y}px)`,
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
        
        <div className="hidden lg:block bg-black/5 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-sans">
            Ctrl + Scroll to Zoom • Two Fingers to Pan
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;