"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from "@/components/made-with-dyad";

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
      <p className="text-[11px] text-gray-500 font-serif line-clamp-2 leading-relaxed italic">
        {excerpt}
      </p>
      <div className="pt-1">
        <p className="text-[10px] text-gray-400 font-sans italic">by {author}</p>
      </div>
    </div>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="h-screen w-screen bg-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating Cards - More visible and detailed */}
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
            <h1 className="text-7xl md:text-[10rem] font-serif font-medium tracking-tight text-gray-900 leading-[0.8] italic">
              The Open Shelf
            </h1>
          </div>
          
          <p className="max-w-xl mx-auto text-xl md:text-2xl text-gray-500 font-serif italic leading-relaxed">
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
              className="group relative overflow-hidden rounded-none border-gray-200 px-16 py-8 text-[11px] uppercase tracking-[0.4em] hover:border-gray-900 transition-colors duration-700"
            >
              <span className="relative z-10">Enter the Shelf</span>
              <motion.div className="absolute inset-0 bg-gray-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </Link>
        </motion.div>
      </main>

      <footer className="absolute bottom-8 left-0 right-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 flex justify-between items-center opacity-30">
          <p className="text-[10px] uppercase tracking-[0.2em] font-sans">v0.1 Alpha</p>
          <MadeWithDyad />
          <p className="text-[10px] uppercase tracking-[0.2em] font-sans">Spatial Reader</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;