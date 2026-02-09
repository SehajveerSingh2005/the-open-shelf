"use client";

import { motion, useTransform, useSpring, useMotionValue, MotionValue } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import MagnetLines from '@/components/MagnetLines';

const GrainOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[99] opacity-[0.035]">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <filter id="noiseFilter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

const MagneticButton = ({ children, className, ...props }: any) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      <motion.div
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      >
        <Button className={className} {...props}>
          {children}
        </Button>
      </motion.div>
    </div>
  );
};

const FloatingCard = ({ delay, x, y, title, source, readingTime, author, excerpt, imageUrl, mouseX, mouseY, factor = 20 }: {
  delay: number;
  x: number;
  y: number;
  title: string;
  source: string;
  readingTime: string;
  author: string;
  excerpt: string;
  imageUrl?: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  factor?: number;
}) => {
  const springConfig = { stiffness: 150, damping: 20 };

  const mouseXDelayed = useSpring(mouseX, springConfig);
  const mouseYDelayed = useSpring(mouseY, springConfig);

  const moveX = useTransform<number, number>(mouseXDelayed, (val) => x + (val - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) / (factor * 2));
  const moveY = useTransform<number, number>(mouseYDelayed, (val) => y + (val - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) / (factor * 2));

  const rotateX = useTransform<number, number>(mouseYDelayed, (val) => (val - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) / factor / 2);
  const rotateY = useTransform<number, number>(mouseXDelayed, (val) => (-(val - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0))) / factor / 2);

  const [randomDur] = useState(() => 8 + Math.random() * 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x, y }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [y, y - 10, y],
      }}
      style={{
        x: moveX,
        y: moveY,
        rotateX,
        rotateY,
        perspective: 1000,
      }}
      transition={{
        duration: 1.5,
        delay,
        y: { repeat: Infinity, duration: randomDur, ease: "easeInOut" }
      }}
      className="absolute w-72 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_4px_40px_-15px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_40px_-15px_rgba(0,0,0,0.3)] hidden lg:block pointer-events-none z-0"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-[14px] font-sans font-semibold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{title}</h4>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-sans font-bold uppercase tracking-[0.15em]">
              {author} • {source}
            </p>
          </div>
          <span className="text-[8px] font-sans text-gray-300 dark:text-gray-600 font-bold whitespace-nowrap tracking-wider">{readingTime}</span>
        </div>

        {imageUrl && (
          <div className="w-full h-36 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100/50 dark:border-gray-700/50">
            <motion.img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-1000"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 3 }}
            />
          </div>
        )}

        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-serif leading-relaxed line-clamp-3 italic">
          {excerpt}
        </p>
      </div>
    </motion.div>
  );
};

const ConnectionLines = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      d="M 300 250 L 500 400"
      stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />
    <circle cx="300" cy="250" r="1.5" fill="currentColor" />
    <circle cx="500" cy="400" r="1.5" fill="currentColor" />
  </svg>
);

const FeatureRow = ({ number, title, description }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col md:flex-row md:items-baseline py-16 border-t border-gray-100 dark:border-gray-900 last:border-b transition-colors duration-300"
    >
      <div className="w-24 shrink-0 mb-4 md:mb-0">
        <span className="text-xs font-mono text-gray-400 dark:text-gray-600">({number})</span>
      </div>
      <div className="flex-1 md:pr-12">
        <h3 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 dark:text-gray-100 group-hover:italic transition-all duration-500">{title}</h3>
      </div>
      <div className="md:w-[400px] mt-6 md:mt-0">
        <p className="text-lg text-gray-500 dark:text-gray-400 font-serif leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

const Landing = () => {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);



  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-x-hidden selection:bg-gray-900 dark:selection:bg-gray-100 selection:text-white dark:selection:text-black transition-colors duration-300">
      <GrainOverlay />

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Universal Grid Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.025] z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center relative shrink-0 z-0 overflow-hidden">
        <ConnectionLines />
        <FloatingCard
          delay={0.2} x={-460} y={-260}
          title="The Varieties of Isolation"
          author="ELIN BROALSON"
          source="AEON"
          readingTime="8 min"
          excerpt="This is the perfect morning for isolation. The silent work of concepts is the true engine of human manifestation."
          imageUrl="/images/isolation.png"
          mouseX={mouseX}
          mouseY={mouseY}
          factor={40}
        />
        <FloatingCard
          delay={0.5} x={420} y={-300}
          title="How to Do Nothing"
          author="JENNY ODELL"
          source="PARIS REVIEW"
          readingTime="12 min"
          excerpt="Think of it as an exercise in attention. Resisting the attention economy is the most powerful act of resistance."
          imageUrl="/images/nature.png"
          mouseX={mouseX}
          mouseY={mouseY}
          factor={30}
        />
        <FloatingCard
          delay={0.8} x={-400} y={240}
          title="Why Bad Design Persists"
          author="BRIAN GREEN JALEN"
          source="THE VIEW"
          readingTime="15 min"
          excerpt="A theme for our times, considering which are and phenomenologically the reasons behind the friction we endure."
          imageUrl="/images/architecture.png"
          mouseX={mouseX}
          mouseY={mouseY}
          factor={50}
        />
        <FloatingCard
          delay={1.1} x={460} y={260}
          title="Terrible Biases"
          author="CLAIRE DECERNER"
          source="PARIS REVIEW"
          readingTime="8 min"
          excerpt="They encourage deep thinking, observation, and reflection. The spatial layout is a container for thought."
          imageUrl="/images/reflection.png"
          mouseX={mouseX}
          mouseY={mouseY}
          factor={35}
        />

        <main className="text-center space-y-16 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="flex flex-col items-center space-y-6">
              <span className="text-xl md:text-xl font-sans font-bold tracking-[0.4em] text-gray-900 dark:text-gray-100 uppercase">The Open Shelf</span>
              <h1 className="text-7xl md:text-[10rem] font-serif font-medium tracking-tighter text-gray-900 dark:text-gray-100 leading-[0.75]">
                A place to think <br />
                <span className="italic">with what you read.</span>
              </h1>
            </div>

            <p className="max-w-lg mx-auto text-lg text-gray-400 dark:text-gray-500 font-serif leading-relaxed italic opacity-70">
              Escape the vertical stream. Organize your digital life on an infinite spatial canvas designed for slow media.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.5 }}
          >
            <Link href="/shelf">
              <MagneticButton
                variant="outline"
                className="group relative rounded-none border-gray-950/10 dark:border-gray-50/10 bg-white dark:bg-gray-900 px-12 py-8 text-[10px] uppercase tracking-[0.5em] hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-700 overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-4">
                  <span>Enter the Shelf</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </MagneticButton>
            </Link>
          </motion.div>
        </main>
      </section>

      {/* Feature Section - Clean Typography */}
      {/* Source Aggregation Section - The Engine */}
      <section className="py-24 px-6 bg-white dark:bg-gray-950 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto text-center space-y-32">

          {/* Main Statement */}
          <div className="space-y-8">
            <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 dark:text-gray-600 font-sans font-bold">The Engine</span>
            <h3 className="text-5xl md:text-8xl font-serif font-medium text-gray-900 dark:text-gray-100 leading-[0.9] tracking-tight">
              Powered by <span className="italic text-gray-400 dark:text-gray-600">open standards.</span> <br />
              Curated by <span className="italic text-gray-400 dark:text-gray-600">you.</span>
            </h3>
          </div>

          {/* Curated Sources Marquee */}
          {/* Curated Sources Marquee */}
          <div className="relative overflow-hidden w-full py-12 border-y border-gray-100 dark:border-gray-900">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10" />

            {/*  
              Source Brand Colors:
              Atlantic: #E11B22 (Red)
              The Verge: #4823D4 (Blurple-ish for distinction) or #E21B3C
              Aeon: #279A91 (Teal)
              Substack: #FF6719 (Orange)
              NYT: #121212 (Black)
              Wired: #000000
              Ars Technica: #FF4E00 (Orange)
              Hacker News: #FF6600 (Orange)
              The New Yorker: #2B2B2B
            */}
            <div className="flex items-center space-x-24 animate-scroll whitespace-nowrap">
              {[
                { name: "The Atlantic", color: "#E11B22", url: "https://www.theatlantic.com" },
                { name: "The Verge", color: "#E21B3C", url: "https://www.theverge.com" },
                { name: "Aeon", color: "#279A91", url: "https://aeon.co" },
                { name: "Substack", color: "#FF6719", url: "https://substack.com" },
                { name: "New York Times", color: "#666", url: "https://www.nytimes.com" }, // Keep neutral or specific
                { name: "Wired", color: "#000000", url: "https://www.wired.com" },
                { name: "Ars Technica", color: "#FF4E00", url: "https://arstechnica.com" },
                { name: "Hacker News", color: "#FF6600", url: "https://news.ycombinator.com" },
                { name: "The New Yorker", color: "#121212", url: "https://www.newyorker.com" }
              ].map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xl md:text-5xl font-serif italic transition-all duration-500 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 cursor-pointer"
                  style={{ color: source.color }}
                >
                  {source.name}
                </a>
              ))}
              {[
                { name: "The Atlantic", color: "#E11B22", url: "https://www.theatlantic.com" },
                { name: "The Verge", color: "#E21B3C", url: "https://www.theverge.com" },
                { name: "Aeon", color: "#279A91", url: "https://aeon.co" },
                { name: "Substack", color: "#FF6719", url: "https://substack.com" },
                { name: "New York Times", color: "#666", url: "https://www.nytimes.com" },
                { name: "Wired", color: "#000000", url: "https://www.wired.com" },
                { name: "Ars Technica", color: "#FF4E00", url: "https://arstechnica.com" },
                { name: "Hacker News", color: "#FF6600", url: "https://news.ycombinator.com" },
                { name: "The New Yorker", color: "#121212", url: "https://www.newyorker.com" }
              ].map((source, i) => (
                <a
                  key={`dup-${i}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xl md:text-5xl font-serif italic transition-all duration-500 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 cursor-pointer"
                  style={{ color: source.color }}
                >
                  {source.name}
                </a>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-24 text-left max-w-4xl mx-auto">
            <div className="space-y-6">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-600">(01) Curated Library</span>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-serif leading-relaxed">
                We've hand-picked the most thoughtful corners of the internet. A starting foundation of high-signal prose, ready for you to explore.
              </p>
            </div>
            <div className="space-y-6">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-600">(02) Bring Your Own</span>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-serif leading-relaxed">
                Complete freedom. Add any RSS feed, newsletter, or publication you trust. Build a personal repository that reflects your intellectual curiosity.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Section - Clean Typography */}
      <section className="py-24 px-6 bg-white dark:bg-gray-950 relative z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col">
            <FeatureRow
              number="01"
              title="Progressive Feed"
              description="A spatial arrangement that respects your cognitive load. It grows as you explore, revealing new ideas only when you're ready to see them."
            />
            <FeatureRow
              number="02"
              title="Editorial Engine"
              description="Typography first. A reading environment stripped of noise and distractions, designed purely for deep engagement and focus."
            />
            <FeatureRow
              number="03"
              title="Curated Stacks"
              description="Don't just browse—collect. Group your high-signal sources into meaningful stacks for later retrieval and contemplation."
            />
          </div>
        </div>
      </section>
      {/* Manifesto Section - Pure Typography */}
      <section className="relative h-screen flex flex-col items-center justify-center p-6 text-center z-10 bg-white dark:bg-gray-950 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-6xl space-y-12"
        >
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-300 dark:text-gray-600 font-sans font-bold">The Manifesto</span>
            <h2 className="text-6xl md:text-9xl font-serif font-medium text-gray-900 dark:text-gray-100 leading-[0.8] tracking-tighter">
              The scroll is <br />
              the enemy of <br />
              <span className="italic">deep thought.</span>
            </h2>
          </div>

          <p className="text-xl md:text-2xl text-gray-400 dark:text-gray-500 font-serif leading-relaxed italic max-w-2xl mx-auto opacity-70">
            "We believe that how you organize your digital consumption changes how you think. The Open Shelf is a spatial expanse for the slow and the profound."
          </p>
        </motion.div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="py-60 relative z-10 bg-white dark:bg-gray-950 border-t border-gray-50 dark:border-gray-900 flex flex-col items-center justify-center text-center transition-colors duration-300 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-40 dark:opacity-30">
          <MagnetLines
            rows={20}
            columns={24}
            containerSize="120vw"
            lineColor="currentColor"
            lineWidth="1.5px"
            lineHeight="2.5rem"
            baseAngle={0}
            className="text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="space-y-12 relative z-20 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm p-12 -mx-12 rounded-full">
          <h3 className="text-5xl md:text-7xl font-serif font-medium text-gray-900 dark:text-gray-100 italic tracking-tighter">Ready to slow down?</h3>
          <Link href="/shelf">
            <MagneticButton
              variant="outline"
              className="rounded-none border-gray-900/10 dark:border-gray-100/10 px-20 py-10 text-[10px] uppercase tracking-[0.5em] hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-700"
            >
              Start Curating
            </MagneticButton>
          </Link>
        </div>
      </section >

      {/* Footer - Minimal Editorial */}
      <footer className="bg-white dark:bg-gray-950 pt-48 pb-24 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-24 mb-32">
            <div className="space-y-8 max-w-sm">
              <h3 className="text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">The Open Shelf</h3>
              <p className="text-gray-400 dark:text-gray-500 font-serif italic text-lg leading-relaxed opacity-70">
                A non-linear repository for ideas, essays, and slow media. Built for those who find depth in the details.
              </p>
            </div>

            <div className="flex gap-24">
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-300 dark:text-gray-600 font-sans font-bold">Explore</p>
                <ul className="space-y-3 font-serif italic text-gray-500 dark:text-gray-400 text-lg">
                  <li><Link href="/shelf" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Canvas</Link></li>
                  <li><Link href="/shelf" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Feed</Link></li>
                  <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Manifesto</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-300 dark:text-gray-600 font-sans font-bold">Social</p>
                <ul className="space-y-3 font-serif italic text-gray-500 dark:text-gray-400 text-lg">
                  <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Substack</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-16 border-t border-gray-50 dark:border-gray-900 flex justify-between items-center text-[9px] uppercase tracking-[0.4em] text-gray-300 dark:text-gray-600 font-bold">
            <p>© 2026 • Spatial Repository</p>
            <div className="flex space-x-12">
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-all">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-all">Back to top</a>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Landing;