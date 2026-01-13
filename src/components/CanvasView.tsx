"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface CanvasViewProps {
  articles: {
    items: Article[];
    dimensions: { width: number; height: number };
  };
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera-v10';

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

  const x = useSpring(rawX, { damping: 40, stiffness: 400, mass: 0.5 });
  const y = useSpring(rawY, { damping: 40, stiffness: 400, mass: 0.5 });
  const scale = useSpring(rawScale, { damping: 30, stiffness: 300 });
  
  const [visibleItems, setVisibleItems] = useState<{ article: Article; offset: { x: number; y: number } }[]>([]);
  const lastUpdatePos = useRef({ x: -9999, y: -9999, scale: -1 });

  // Dragging state
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);

  const updateVisibility = useCallback((force = false) => {
    const container = containerRef.current;
    if (!container) return;

    const s = rawScale.get();
    const curX = rawX.get();
    const curY = rawY.get();
    const { width, height } = articles.dimensions;
    if (width === 0 || height === 0) return;

    // Significantly reduce update frequency to prevent component "fluttering"
    const dist = Math.sqrt(Math.pow(curX - lastUpdatePos.current.x, 2) + Math.pow(curY - lastUpdatePos.current.y, 2));
    const scaleDiff = Math.abs(s - lastUpdatePos.current.scale);
    
    if (!force && dist < 400 && scaleDiff < 0.1) {
      return;
    }

    lastUpdatePos.current = { x: curX, y: curY, scale: s };
    
    const margin = 1000; // Large margin to keep items mounted longer
    const worldViewLeft = (-curX - container.offsetWidth / 2) / s - margin;
    const worldViewRight = (-curX + container.offsetWidth / 2) / s + margin;
    const worldViewTop = (-curY - container.offsetHeight / 2) / s - margin;
    const worldViewBottom = (-curY + container.offsetHeight / 2) / s + margin;

    const blockX = Math.floor(-curX / width);
    const blockY = Math.floor(-curY / height);

    const nextVisible: { article: Article; offset: { x: number; y: number } }[] = [];

    for (let bx = blockX - 1; bx <= blockX + 1; bx++) {
      for (let by = blockY - 1; by <= blockY + 1; by++) {
        const offsetX = bx * width;
        const offsetY = by * height;
        
        for (const art of articles.items) {
          const absX = art.x + offsetX;
          const absY = art.y + offsetY;
          
          if (absX >= worldViewLeft && absX <= worldViewRight &&
              absY >= worldViewTop && absY <= worldViewBottom) {
            nextVisible.push({ article: art, offset: { x: offsetX, y: offsetY } });
          }
        }
      }
    }
    
    // Check if the set of items actually changed to avoid redundant state updates
    setVisibleItems(prev => {
      if (prev.length === nextVisible.length && 
          prev.every((p, i) => p.article.id === nextVisible[i].article.id && 
                              p.offset.x === nextVisible[i].offset.x && 
                              p.offset.y === nextVisible[i].offset.y)) {
        return prev;
      }
      return nextVisible;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: curX, y: curY, scale: s }));
  }, [articles]);

  useEffect(() => {
    const unsubX = rawX.on('change', () => updateVisibility());
    const unsubY = rawY.on('change', () => updateVisibility());
    const unsubScale = rawScale.on('change', () => updateVisibility());
    
    updateVisibility(true);
    return () => { unsubX(); unsubY(); unsubScale(); };
  }, [rawX, rawY, rawScale, updateVisibility]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const s = rawScale.get();
        const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = Math.min(Math.max(s * zoomFactor, 0.4), 1.2);
        
        if (newScale !== s) {
          const focalX = e.clientX - rect.left - rect.width / 2;
          const focalY = e.clientY - rect.top - rect.height / 2;
          const worldX = (focalX - rawX.get()) / s;
          const worldY = (focalY - rawY.get()) / s;
          rawX.set(focalX - worldX * newScale);
          rawY.set(focalY - worldY * newScale);
          rawScale.set(newScale);
        }
      } else {
        rawX.set(rawX.get() - e.deltaX);
        rawY.set(rawY.get() - e.deltaY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      dragDistance.current = 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      dragDistance.current += Math.sqrt(dx * dx + dy * dy);
      rawX.set(rawX.get() + dx);
      rawY.set(rawY.get() + dy);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDragging.current = false; };

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [rawX, rawY, rawScale]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background touch-none cursor-grab active:cursor-grabbing select-none"
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
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
              transform: 'translateX(-50%)',
              willChange: 'transform'
            }}
          >
            <ArticleCard 
              article={article} 
              onClick={(a) => dragDistance.current < 10 && onArticleClick(a)} 
              isCanvas 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default CanvasView;