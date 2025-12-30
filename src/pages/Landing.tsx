"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from "@/components/made-with-dyad";

const FloatingCard = ({ delay, x, y, title, source, opacity = 0.6 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, x, y }}
    animate={{ 
      opacity, 
      scale: 1,
      y: [y, y - 15, y],
    }}
    transition={{ 
      duration: 4, 
      delay, 
      y: { repeat: Infinity, duration: 5 + Math.random() * 2, ease: "easeInOut" } 
    }}
    className="absolute w-48 p-4 bg-white border border-gray-100 shadow-sm hidden md:block pointer-events-none"
  >
    <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">{source}</p>
    <h4 className="text-sm font-serif text-gray-800 line-clamp-2">{title}</h4>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="h-screen w-screen bg-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating Cards */}
      <FloatingCard 
        delay={0.2} x="-280px" y="-180px" 
        title="The Architecture of Silence" 
        source="AEON" 
      />
      <FloatingCard 
        delay={0.5} x="240px" y="-120px" 
        title="Why We Read Long-Form" 
        source="THE BROWSER" 
        opacity={0.4}
      />
      <FloatingCard 
        delay={0.8} x="-220px" y="150px" 
        title="The Lost Art of Letters" 
        source="SUBSTACK" 
      />
      <FloatingCard 
        delay={1.1} x="300px" y="180px" 
        title="Minimalism as Cognitive Rest" 
        source="INDEPENDENT" 
        opacity={0.3}
      />

      <main className="relative z-10 text-center space-y-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-sans ml-[0.5em]">
              A Calm Space for Thought
            </p>
            <h1 className="text-7xl md:text-9xl font-serif font-medium tracking-tight text-gray-900 leading-[0.9]">
              The Open Shelf
            </h1>
          </div>
          
          <p className="max-w-lg mx-auto text-xl text-gray-500 font-serif italic leading-relaxed">
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
              className="group relative overflow-hidden rounded-none border-gray-200 px-12 py-7 text-[10px] uppercase tracking-[0.3em] hover:border-gray-900 transition-colors duration-500"
            >
              <span className="relative z-10">Enter the Shelf</span>
              <motion.div className="absolute inset-0 bg-gray-900 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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