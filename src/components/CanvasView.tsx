"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

// Persist camera state outside component to survive re-mounts/re-renders
let persistentX = 0;
let persistentY = 0;
let persistentScale = 0.6;
let hasInitialized = false;

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // World State
  const x = useMotionValue(persistentX);
  const y = useMotionValue(persistentY);
  const scale = useMotionValue(persistentScale);
  
  // Smoothness
  const smoothX = useSpring(x, { damping: 45, stiffness: 200 });
  const smoothY = useSpring(y, { damping: 45, stiffness: 200 });
  const smoothScale = useSpring(scale, { damping: 45, stiffness: 200 });

  // Sync back to persistent state
  useEffect(() => {
    const unsubX = x.on('change', v => persistentX = v);
    const unsubY = y.on('change', v => persistentY = v);
    const unsubScale = scale.on('change', v => persistentScale = v);
    return () => {
      unsubX(); unsubY(); unsubScale();
    };
  }, [x, y, scale]);

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

  // Initial center only once
  useEffect(() => {
    if (articles.length > 0 && !hasInitialized) {
      centerCanvas(true);
      hasInitialized = true;
    }
  }, [articles.length, centerCanvas]);

  const handleZoom = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentScale = scale.get();
    
    const zoomSpeed = 0.004;
    const newScale = Math.min(Math.max(currentScale - deltaY * zoomSpeed, 0.05), 3);
    
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
        scale.set(Math.min(Math.max(initialScale * factor, 0.05), 3));
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
      className="w-full h-full relative overflow-hidden bg-[#050505] touch-none"
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

      {/* Cosmic Background (Stars) */}
      <motion.div 
        style={{ x: smoothX, y: smoothY, scale: smoothScale }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-[-10000px] opacity-30" 
          style={{
            backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }}
        />
        <div className="absolute inset-[-10000px] opacity-10" 
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '400px 400px'
          }}
        />
      </motion.div>

      {/* The World Container */}
      <motion.div
        style={{ 
          x: smoothX, 
          y: smoothY, 
          scale: smoothScale,
          transformOrigin: '0 0'
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
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 shadow-2xl rounded-full flex items-center space-x-3 pointer-events-auto">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-sans">
            {Math.round(scale.get() * 100)}% Perspective
          </p>
          <div className="h-3 w-px bg-white/10" />
          <button 
            onClick={() => centerCanvas()}
            className="text-[9px] uppercase tracking-widest text-gray-300 hover:text-white transition-colors"
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;