"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from "@/components/made-with-dyad";

const Landing = () => {
  return (
    <div className="h-screen w-screen bg-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid - The 'Canvas' look */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative "Ghost" Cards to hint at the app's UI */}
      <motion.div 
        initial={{ opacity: 0, x: -100, y: -50 }}
        animate={{ opacity: 0.4, x: -150, y: -100 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-40 bg-white border border-gray-100 shadow-sm hidden md:block"
      />
      <motion.div 
        initial={{ opacity: 0, x: 100, y: 50 }}
        animate={{ opacity: 0.4, x: 200, y: 150 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-1/4 right-1/4 w-64 h-48 bg-white border border-gray-100 shadow-sm hidden md:block"
      />

      <main className="relative z-10 text-center space-y-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-4"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-sans">
            A Calm Space for Thought
          </p>
          <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-gray-900">
            The Open Shelf
          </h1>
          <p className="max-w-md mx-auto text-lg text-gray-500 font-serif italic leading-relaxed">
            A spatial reading platform for long-form essays, independent blogs, and deep thinkers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <Link to="/app">
            <Button 
              variant="outline" 
              className="rounded-none border-gray-900 px-12 py-6 text-[10px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              Enter the Shelf
            </Button>
          </Link>
        </motion.div>
      </main>

      <footer className="absolute bottom-8 left-0 right-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 flex justify-between items-center opacity-40">
          <p className="text-[10px] uppercase tracking-widest font-sans">v0.1 Alpha</p>
          <MadeWithDyad />
          <p className="text-[10px] uppercase tracking-widest font-sans">Spatial Reader</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;