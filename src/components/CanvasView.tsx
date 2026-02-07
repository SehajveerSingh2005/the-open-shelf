"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';
import { Hand, MousePointer2, X, RefreshCw } from 'lucide-react';

interface CanvasViewProps {
  articles: {
    items: Article[];
    dimensions: { width: number; height: number };
  };
  onArticleClick: (article: Article) => void;
  onRefresh?: () => void;
}

const STORAGE_KEY = 'open-shelf-camera-v11';

const getStoredState = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0, scale: 1.0 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 1.0 };
  } catch {
    return { x: 0, y: 0, scale: 1.0 };
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

const CanvasView = ({ articles, onArticleClick, onRefresh }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with stored state to avoid flicker
  const [initialState] = useState(() => getStoredState());

  const rawX = useMotionValue(initialState.x);
  const rawY = useMotionValue(initialState.y);
  const rawScale = useMotionValue(initialState.scale);

  const x = useSpring(rawX, { damping: 45, stiffness: 350, mass: 0.6 });
  const y = useSpring(rawY, { damping: 45, stiffness: 350, mass: 0.6 });
  const scale = useSpring(rawScale, { damping: 30, stiffness: 300 });

  const [visibleItems, setVisibleItems] = useState<Article[]>([]);
  const lastUpdatePos = useRef({ x: -9999, y: -9999, scale: -1 });

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);

  // Dynamic opacity for Explore button based on distance from center
  const radius = articles.dimensions.width / 2;
  const exploreOpacity = useTransform(
    [x, y, scale],
    ([latestX, latestY, latestScale]) => {
      const s = latestScale as number;
      // Calculate center in content space
      const centerX = -(latestX as number) / s;
      const centerY = -(latestY as number) / s;
      const dist = Math.sqrt(centerX * centerX + centerY * centerY);

      // Fade in when approaching the edge (70% of radius)
      const threshold = radius * 0.7;
      if (dist < threshold) return 0;
      return Math.min((dist - threshold) / 200, 1);
    }
  );

  const explorePointerEvents = useTransform(exploreOpacity, opacity => opacity > 0.1 ? 'auto' : 'none');

  // Helper to clamp pan values within content bounds
  const clampPan = useCallback((newX: number, newY: number, currentScale: number) => {
    // ... (keep logic but relax clamping to allow exploring empty space?)
    // Actually, user wants to find the button in empty area, so we MUST allow panning into empty area.
    // I will relax the padding significantly or remove hard clamping if "Explore" is the goal.
    // But for now keeping standard clamping with large padding is safer to prevent getting lost.
    const container = containerRef.current;
    if (!container) return { x: newX, y: newY };

    const { width, height } = articles.dimensions;

    // Calculate content bounds in screen space
    const contentWidth = width * currentScale;
    const contentHeight = height * currentScale;

    // Increase padding to allow users to see "Explore" area
    const padding = 600;

    // Calculate max/min pan values
    const maxX = (contentWidth / 2) + padding;
    const minX = -(contentWidth / 2) - padding;
    const maxY = (contentHeight / 2) + padding;
    const minY = -(contentHeight / 2) - padding;

    return {
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    };
  }, [articles.dimensions]);

  const updateVisibility = useCallback((force = false) => {
    const container = containerRef.current;
    if (!container) return;

    const s = rawScale.get();
    const curX = rawX.get();
    const curY = rawY.get();

    const dist = Math.sqrt(Math.pow(curX - lastUpdatePos.current.x, 2) + Math.pow(curY - lastUpdatePos.current.y, 2));
    const scaleDiff = Math.abs(s - lastUpdatePos.current.scale);

    if (!force && dist < 300 && scaleDiff < 0.05) return;

    lastUpdatePos.current = { x: curX, y: curY, scale: s };

    const margin = 1200;
    const worldViewLeft = (-curX - container.offsetWidth / 2) / s - margin;
    const worldViewRight = (-curX + container.offsetWidth / 2) / s + margin;
    const worldViewTop = (-curY - container.offsetHeight / 2) / s - margin;
    const worldViewBottom = (-curY + container.offsetHeight / 2) / s + margin;

    // Simple visibility check - no duplication
    const nextVisible = articles.items.filter(art => {
      return art.x >= worldViewLeft && art.x <= worldViewRight &&
        art.y >= worldViewTop && art.y <= worldViewBottom;
    });

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
        const newX = rawX.get() - e.deltaX;
        const newY = rawY.get() - e.deltaY;
        const clamped = clampPan(newX, newY, rawScale.get());
        rawX.set(clamped.x);
        rawY.set(clamped.y);
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
      const newX = rawX.get() + dx;
      const newY = rawY.get() + dy;
      const clamped = clampPan(newX, newY, rawScale.get());
      rawX.set(clamped.x);
      rawY.set(clamped.y);
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
  }, [rawX, rawY, rawScale, clampPan]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background touch-none cursor-grab active:cursor-grabbing select-none"
    >
      <SpatialGuide />
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.08] text-gray-900 dark:text-gray-100"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: useTransform([x, y], ([bx, by]) => `calc(50% + ${bx}px) calc(50% + ${by}px)`)
        }}
      />

      <motion.div
        style={{ x, y, scale }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
      >
        {visibleItems.map((article) => (
          <div
            key={article.id}
            className="absolute pointer-events-auto"
            style={{
              left: article.x,
              top: article.y,
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

      {/* Floating Explore Button */}
      {onRefresh && (
        <motion.div
          style={{ opacity: exploreOpacity, pointerEvents: explorePointerEvents }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center space-y-3"
        >
          <button
            onClick={() => onRefresh()}
            className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110 transition-all duration-300 group"
          >
            <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-gray-400 dark:text-gray-500 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
            Explore More
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default CanvasView;