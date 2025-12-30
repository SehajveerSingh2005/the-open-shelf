"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { BookOpen, Map, Zap } from 'lucide-react';

const FloatingCard = ({ delay, x, y, title, source, readingTime, author, excerpt, opacity = 0.9 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, x, y }}
    animate={{ 
      opacity, 
      scale: 1,
      y: [y, y - 20, y],
    }}
    transition={{ 
      duration: 5, 
      delay, 
      y: { repeat: Infinity, duration: 6 + Math.random() * 4, ease: "easeInOut" } 
    }}
    className="absolute w-64 p-5 bg-white border border-gray-100 shadow-sm hidden lg:block pointer-events-none"
  >
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-[9px] uppercase tracking-widest text-gray-400 font-sans">
          {source} • {readingTime}
        </p>
        <h4 className="text-lg font-serif font-medium leading-tight text-gray-900">{title}</h4>
      </div>
      <p className="text-[11px] text-gray-500 font-serif line-clamp-2 leading-relaxed">
        {excerpt}
      </p>
      <div className="pt-1">
        <p className="text-[10px] text-gray-400 font-sans italic">by {author}</p>
      </div>
    </div>
  </motion.div>
);

const Feature = ({ icon: Icon, title, description }: any) => (
  <div className="space-y-4 text-center p-8">
    <div className="flex justify-center">
      <Icon size={32} strokeWidth={1} className="text-gray-400" />
    </div>
    <h3 className="text-2xl font-serif font-medium text-gray-900">{title}</h3>
    <p className="text-gray-500 font-serif leading-relaxed italic max-w-xs mx-auto">
      {description}
    </p>
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col relative overflow-x-hidden">
      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center relative shrink-0">
        {/* Background Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating Cards */}
        <FloatingCard 
          delay={0.2} x="-320px" y="-220px" 
          title="The Architecture of Silence" 
          source="AEON" 
          readingTime="12 min"
          author="Elena Rossi"
          excerpt="In the modern world, silence has become a luxury. We explore minimalist design."
        />
        <FloatingCard 
          delay={0.5} x="300px" y="-140px" 
          title="Why We Read Long-Form" 
          source="THE BROWSER" 
          readingTime="8 min"
          author="Julian Barnes"
          excerpt="The neurological benefits of deep reading are being lost to the scroll."
          opacity={0.7}
        />
        <FloatingCard 
          delay={0.8} x="-280px" y="160px" 
          title="The Lost Art of Letters" 
          source="SUBSTACK" 
          readingTime="15 min"
          author="Sarah Jenkins"
          excerpt="A letter is a physical manifestation of time spent thinking about someone else."
        />
        <FloatingCard 
          delay={1.1} x="340px" y="200px" 
          title="Minimalism as Rest" 
          source="INDEPENDENT" 
          readingTime="10 min"
          author="Thomas Cole"
          excerpt="How reducing our digital intake can lead to profound cognitive restoration."
          opacity={0.6}
        />

        <main className="relative z-10 text-center space-y-12 px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.6em] text-gray-400 font-sans ml-[0.6em]">
                A Calm Space for Thought
              </p>
              <h1 className="text-7xl md:text-[10rem] font-serif font-medium tracking-tight text-gray-900 leading-[0.8]">
                The Open Shelf
              </h1>
            </div>
            
            <p className="max-w-xl mx-auto text-xl md:text-2xl text-gray-500 font-serif leading-relaxed">
              A spatial reading platform for long-form essays, independent blogs, and deep thinkers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Link to="/app">
              <Button 
                variant="outline" 
                className="group relative rounded-none border-gray-200 px-16 py-8 text-[11px] uppercase tracking-[0.4em] hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300"
              >
                <span className="relative z-10">Enter the Shelf</span>
              </Button>
            </Link>
          </motion.div>
        </main>
      </section>

      {/* Philosophy/Features Section */}
      <section className="py-32 border-t border-gray-100 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <Feature 
              icon={Map}
              title="Spatial Layout"
              description="Organize your reading list on an infinite canvas. Map out connections between ideas and authors."
            />
            <Feature 
              icon={BookOpen}
              title="Deep Reading"
              description="A minimalist, distraction-free reader designed for long-form content. No ads, no sidebars, just text."
            />
            <Feature 
              icon={Zap}
              title="Curated Feed"
              description="Discover high-quality essays from independent sources, Substacks, and long-form journals."
            />
          </div>

          <div className="mt-40 text-center max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-gray-900">
              Escape the scroll.
            </h2>
            <p className="text-lg text-gray-500 font-serif leading-relaxed italic">
              Most of our digital life is a vertical stream of noise. The Open Shelf is a horizontal expanse of thought. We believe that how you organize your digital consumption changes how you think.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col items-center space-y-8 opacity-40">
          <div className="flex justify-between w-full items-center">
            <p className="text-[10px] uppercase tracking-[0.2em] font-sans">v0.1 Alpha</p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-sans">Spatial Reader</p>
          </div>
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
};

export default Landing;