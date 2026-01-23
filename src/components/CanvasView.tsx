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

const STORAGE_KEY = 'open-shelf-camera-v11';

const getStoredState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 0.8 };
  } catch {
    return { x: 0, y: 0, scale: 0.8 };
  }
};

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialState = useMemo(() => getStoredState(), []);
  
  const rawX = useMotionValue(initialState.x);
  const rawY = useMotionValue(initialState.y);
  const rawScale = useMotionValue(initialState.scale);

  const x = useSpring(rawX, { damping: 45, stiffness: 350, mass: 0.6 });
  const y = useSpring(rawY, { damping: 45, stiffness: 350, mass: 0.6 });
  const scale = useSpring(rawScale, { damping: 30, stiffness: 300 });
  
  const [visibleItems, setVisibleItems] = useState<{ article: Article; offset: { x: number; y: number }; key: string }[]>([]);
  const lastUpdatePos = useRef({ x: -9999, y: -9999, scale: -1 });

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
    
    // If dimensions are zero (e.g., no articles), skip
    if (width === 0 || height === 0 || articles.items.length === 0) {
      setVisibleItems([]);
      return;
    }

    const dist = Math.sqrt(Math.pow(curX - lastUpdatePos.current.x, 2) + Math.pow(curY - lastUpdatePos.current.y, 2));
    const scaleDiff = Math.abs(s - lastUpdatePos.current.scale);
    
    if (!force && dist < 300 && scaleDiff < 0.05) return;

    lastUpdatePos.current = { x: curX, y: curY, scale: s };
    
    const margin = 1200; 
    
    // Calculate the world coordinates of the viewport edges
    const worldViewLeft = (-curX - container.offsetWidth / 2) / s - margin;
    const worldViewRight = (-curX + container.offsetWidth / 2) / s + margin;
    const worldViewTop = (-curY - container.offsetHeight / 2) / s - margin;
    const worldViewBottom = (-curY + container.offsetHeight / 2) / s + margin;

    // Determine the range of repeating blocks (bx, by) that intersect the viewport
    const blockXStart = Math.floor(worldViewLeft / width);
    const blockXEnd = Math.ceil(worldViewRight / width);
    const blockYStart = Math.floor(worldViewTop / height);
    const blockYEnd = Math.ceil(worldViewBottom / height);

    const nextVisible: { article: Article; offset: { x: number; y: number }; key: string }[] = [];

    for (let bx = blockXStart; bx < blockXEnd; bx++) {
      for (let by = blockYStart; by < blockYEnd; by++) {
        const offsetX = bx * width;
        const offsetY = by * height;
        
        // Iterate over the single set of articles (the origin block)
        for (const art of articles.items) {
          const absX = art.x + offsetX;
          const absY = art.y + offsetY;
          
          // Check if the article in this specific block is visible
          if (absX >= worldViewLeft && absX <= worldViewRight &&
              absY >= worldViewTop && absY <= worldViewBottom) {
            nextVisible.push({ 
              article: art, 
              offset: { x: offsetX, y: offsetY },
              key: `${art.id}-${bx}-${by}` // Unique key for React
            });
          }
        }
      }
    }
    
    setVisibleItems(nextVisible);
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
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const s = rawScale.get();
        const zoomFactor = e.deltaY > 0 ? 0.94 : 1.06;
        const newScale = Math.min(Math.max(s * zoomFactor, 0.3), 1.2);
        
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
        // Only prevent if scrolling horizontally or explicitly scrolling the canvas
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
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
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
        {visibleItems.map(({ article, offset, key }) => (
          <div 
            key={key} 
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