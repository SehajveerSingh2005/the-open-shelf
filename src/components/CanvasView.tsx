"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Hand, MousePointer2, X } from 'lucide-react';

interface CanvasViewProps {
  articles: {
    items: Article[];
    dimensions: { width: number; height: number };
  };
  onArticleClick: (article: Article) => void;
}

const STORAGE_KEY = 'open-shelf-camera-v11';

const getStoredState = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0, scale: 0.8 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 0.8 };
  } catch {
    return { x: 0, y: 0, scale: 0.8 };
  }
};

const GUIDE_KEY = 'open-shelf-guide-v1';

const SpatialGuide = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(GUIDE_KEY);
    if (!hasSeen) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(GUIDE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gray-950/95 backdrop-blur-xl px-7 py-3 rounded-full flex items-center space-x-10 pointer-events-auto border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center space-x-4">
              <Hand size={14} className="text-white/50" strokeWidth={1} />
              <div className="flex flex-col -space-y-0.5">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">Pan</span>
                <span className="text-[7px] text-white/30 uppercase tracking-widest font-semibold italic">Drag / Swipe</span>
              </div>
            </div>

            <div className="w-px h-5 bg-white/5" />

            <div className="flex items-center space-x-4">
              <MousePointer2 size={14} className="text-white/50" strokeWidth={1} />
              <div className="flex flex-col -space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">Zoom</span>
                  <div className="flex items-center space-x-1 opacity-40">
                    <span className="text-[7px] border border-white/30 px-1 py-0 rounded-[2px] font-sans font-black">CTRL</span>
                    <span className="text-[9px]">+</span>
                    <span className="text-[8px] font-serif italic">scroll</span>
                  </div>
                </div>
                <span className="text-[7px] text-white/30 uppercase tracking-widest font-semibold italic">or Pinch to zoom</span>
              </div>
            </div>

            <div className="w-px h-5 bg-white/5" />

            <button
              onClick={dismiss}
              className="p-1.5 hover:bg-white/5 rounded-full transition-all duration-300 group"
            >
              <X size={14} className="text-white/20 group-hover:text-white transition-colors" strokeWidth={1} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CanvasView = ({ articles, onArticleClick }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with stored state to avoid flicker
  const [initialState] = useState(() => getStoredState());

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
    if (width === 0 || height === 0) return;

    const dist = Math.sqrt(Math.pow(curX - lastUpdatePos.current.x, 2) + Math.pow(curY - lastUpdatePos.current.y, 2));
    const scaleDiff = Math.abs(s - lastUpdatePos.current.scale);

    if (!force && dist < 300 && scaleDiff < 0.05) return;

    lastUpdatePos.current = { x: curX, y: curY, scale: s };

    const margin = 1200;
    const worldViewLeft = (-curX - container.offsetWidth / 2) / s - margin;
    const worldViewRight = (-curX + container.offsetWidth / 2) / s + margin;
    const worldViewTop = (-curY - container.offsetHeight / 2) / s - margin;
    const worldViewBottom = (-curY + container.offsetHeight / 2) / s + margin;

    const blockX = Math.floor(-curX / width);
    const blockY = Math.floor(-curY / height);

    const nextVisible: { article: Article; offset: { x: number; y: number }; key: string }[] = [];

    for (let bx = blockX - 2; bx <= blockX + 2; bx++) {
      for (let by = blockY - 2; by <= blockY + 2; by++) {
        const offsetX = bx * width;
        const offsetY = by * height;

        const seed = Math.abs((bx * 31 + by * 17) % articles.items.length);

        for (let i = 0; i < articles.items.length; i++) {
          const index = (i + seed) % articles.items.length;
          const art = articles.items[index];

          const absX = art.x + offsetX;
          const absY = art.y + offsetY;

          if (absX >= worldViewLeft && absX <= worldViewRight &&
            absY >= worldViewTop && absY <= worldViewBottom) {
            nextVisible.push({
              article: art,
              offset: { x: offsetX, y: offsetY },
              key: `${art.id}-${bx}-${by}`
            });
          }
        }
      }
    }

    setVisibleItems(nextVisible);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: curX, y: curY, scale: s }));
  }, [articles, rawScale, rawX, rawY]);

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
      <SpatialGuide />
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