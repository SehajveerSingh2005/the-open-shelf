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
  const [currentScale, setCurrentScale] = useState(initialState.scale);
  const lastUpdatePos = useRef({ x: -9999, y: -9999 });

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

    const dist = Math.sqrt(Math.pow(curX - lastUpdatePos.current.x, 2) + Math.pow(curY - lastUpdatePos.current.y, 2));
    if (!force && dist < 200 && Math.abs(s - currentScale) < 0.05) {
      return;
    }

    lastUpdatePos.current = { x: curX, y: curY };
    setCurrentScale(s);
    
    // Viewport bounds in world coordinates
    const viewW = container.offsetWidth / s;
    const viewH = container.offsetHeight / s;
    const margin = 500; // Extra padding around viewport

    const worldViewLeft = (-curX - container.offsetWidth / 2) / s - margin;
    const worldViewRight = (-curX + container.offsetWidth / 2) / s + margin;
    const worldViewTop = (-curY - container.offsetHeight / 2) / s - margin;
    const worldViewBottom = (-curY + container.offsetHeight / 2) / s + margin;

    const blockX = Math.floor(-curX / width);
    const blockY = Math.floor(-curY / height);

    const nextVisible: { article: Article; offset: { x: number; y: number } }[] = [];

    // Only check current and adjacent blocks
    for (let bx = blockX - 1; bx <= blockX + 1; bx++) {
      for (let by = blockY - 1; by <= blockY + 1; by++) {
        const offsetX = bx * width;
        const offsetY = by * height;
        
        for (const art of articles.items) {
          const absX = art.x + offsetX;
          const absY = art.y + offsetY;
          
          // Spatial culling: Only add to DOM if within viewport+margin
          if (absX >= worldViewLeft && absX <= worldViewRight &&
              absY >= worldViewTop && absY <= worldViewBottom) {
            nextVisible.push({ article: art, offset: { x: offsetX, y: offsetY } });
          }
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
    
    const zoomFactor = deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.min(Math.max(s * zoomFactor, 0.4), 1.2);
    
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

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only
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

    const handleMouseUp = () => {
      isDragging.current = false;
    };

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
  }, [rawX, rawY, handleZoom]);

  const onArticleClickWrapper = (article: Article) => {
    if (dragDistance.current < 10) {
      onArticleClick(article);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background touch-none cursor-grab active:cursor-grabbing select-none"
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
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
              onClick={onArticleClickWrapper} 
              isCanvas 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default CanvasView;