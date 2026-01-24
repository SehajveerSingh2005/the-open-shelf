"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Map, Zap, Mail, ArrowRight } from 'lucide-react';

const FloatingCard = ({ delay, x, y, title, source, readingTime, author, excerpt, hasImage, opacity = 1 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, x, y }}
    animate={{ 
      opacity, 
      scale: 1,
      y: [y, y - 12, y],
    }}
    transition={{ 
      duration: 1.5, 
      delay, 
      y: { repeat: Infinity, duration: 8 + Math.random() * 5, ease: "easeInOut" } 
    }}
    className="absolute w-72 p-6 bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hidden lg:block pointer-events-none z-10"
  >
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-[15px] font-sans font-semibold text-gray-900 leading-tight">{title}</h4>
          <p className="text-[10px] text-gray-400 font-sans font-medium uppercase tracking-wider">
            {author} • {source}
          </p>
        </div>
        <span className="text-[9px] font-sans text-gray-300 font-medium whitespace-nowrap">{readingTime}</span>
      </div>
      
      {hasImage && (
        <div className="w-full h-32 bg-gray-50 flex items-center justify-center border border-gray-50">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 opacity-50" />
        </div>
      )}

      <p className="text-[11px] text-gray-500 font-serif leading-relaxed line-clamp-3 italic">
        {excerpt}
      </p>
    </div>
  </motion.div>
);

const ConnectionLines = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
    <path d="M 300 250 L 500 400" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
    <path d="M 800 300 L 700 500" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
    <path d="M 400 650 L 600 550" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
    <path d="M 1100 200 L 950 450" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
    <circle cx="300" cy="250" r="2" fill="currentColor" />
    <circle cx="500" cy="400" r="2" fill="currentColor" />
    <circle cx="800" cy="300" r="2" fill="currentColor" />
    <circle cx="1100" cy="200" r="2" fill="currentColor" />
  </svg>
);

const Feature = ({ icon: Icon, title, description }: any) => (
  <div className="space-y-4 text-center p-8 relative">
    <div className="flex justify-center">
      <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm mb-4">
        <Icon size={20} strokeWidth={1.5} className="text-gray-900" />
      </div>
    </div>
    <h3 className="text-2xl font-serif font-medium text-gray-900">{title}</h3>
    <p className="text-gray-500 font-serif leading-relaxed italic max-w-xs mx-auto text-lg">
      {description}
    </p>
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative overflow-x-hidden">
      {/* Universal Grid Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center relative shrink-0 z-10">
        <ConnectionLines />

        <FloatingCard 
          delay={0.2} x="-420px" y="-240px" 
          title="The Varieties of Isolation" 
          author="ELIN BROALSON"
          source="AEON" 
          readingTime="8 min"
          excerpt="This is the perfect morning for isolation. The silent work of concepts is the true engine of human manifestation."
          hasImage
        />
        <FloatingCard 
          delay={0.5} x="380px" y="-280px" 
          title="How to Do Nothing" 
          author="JENNY ODELL"
          source="PARIS REVIEW" 
          readingTime="12 min"
          excerpt="Think of it as an exercise in attention. Resisting the attention economy is the most powerful act of resistance."
        />
        <FloatingCard 
          delay={0.8} x="-380px" y="220px" 
          title="Why Bad Design Persists" 
          author="BRIAN GREEN JALEN"
          source="THE VIEW" 
          readingTime="15 min"
          excerpt="A theme for our times, considering which are and phenomenologically the reasons behind the friction we endure."
        />
        <FloatingCard 
          delay={1.1} x="420px" y="240px" 
          title="Terrible Biases" 
          author="CLAIRE DECERNER"
          source="PARIS REVIEW" 
          readingTime="8 min"
          excerpt="They encourage deep thinking, observation, and reflection. The spatial layout is a container for thought."
        />

        <main className="text-center space-y-12 px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center space-y-4">
              <span className="text-[10px] uppercase tracking-[0.6em] font-sans font-bold text-gray-400">The Open Shelf</span>
              <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-gray-900 leading-[0.95]">
                A place to think <br />
                <span className="italic">with what you read.</span>
              </h1>
            </div>
            
            <p className="max-w-xl mx-auto text-lg md:text-xl text-gray-400 font-serif leading-relaxed italic">
              Escape the vertical stream. Organize your digital life on an infinite spatial canvas designed for slow media.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Link href="/shelf">
              <Button 
                variant="outline" 
                className="group relative rounded-none border-gray-900/10 bg-white/50 backdrop-blur-sm px-12 py-8 text-[11px] uppercase tracking-[0.4em] hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-500 shadow-sm"
              >
                <span className="relative z-10 flex items-center space-x-4">
                  <span>Enter the Shelf</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </motion.div>
        </main>
      </section>

      {/* Philosophy Section */}
      <section className="py-60 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-16 md:gap-8">
            <Feature 
              icon={Map}
              title="Spatial Layout"
              description="Break free from the list. Arrange articles, essays, and notes on a two-dimensional map to see connections."
            />
            <Feature 
              icon={BookOpen}
              title="Editorial Reader"
              description="A minimalist, focused reading environment that puts typography first. No distractions, just the text."
            />
            <Feature 
              icon={Zap}
              title="Thought Sync"
              description="Connect your favorite RSS feeds, Substacks, and newsletters. Curate your own intellectual garden."
            />
          </div>

          <div className="mt-60 text-center max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-sans font-bold">The Manifesto</span>
              <h2 className="text-5xl md:text-7xl font-serif font-medium text-gray-900 leading-[1.1]">
                The scroll is the enemy <br />
                of deep thought.
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-gray-500 font-serif leading-relaxed italic max-w-2xl mx-auto">
              "We believe that how you organize your digital consumption changes how you think. The Open Shelf is a horizontal expanse for the slow, the long-form, and the profound."
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative z-10 border-t border-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
           <h3 className="text-4xl font-serif font-medium text-gray-900 italic">Ready to slow down?</h3>
           <Link href="/shelf">
            <Button 
              variant="outline" 
              className="rounded-none border-gray-900/10 bg-white/50 backdrop-blur-sm px-16 py-8 text-[11px] uppercase tracking-[0.4em] hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-500"
            >
              Start Curating
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-32 pb-16 border-t border-gray-100 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-32">
            <div className="col-span-1 lg:col-span-2 space-y-8">
              <h3 className="text-3xl font-serif font-medium text-gray-900 tracking-tight">The Open Shelf</h3>
              <p className="text-gray-400 font-serif italic max-w-sm leading-relaxed text-lg">
                A non-linear repository for ideas, essays, and slow media. Built for those who find depth in the details.
              </p>
            </div>
            
            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans font-bold">Explore</p>
              <ul className="space-y-3 font-serif text-gray-600 text-lg italic">
                <li><Link href="/shelf" className="hover:text-gray-900 transition-colors">The Canvas</Link></li>
                <li><Link href="/shelf" className="hover:text-gray-900 transition-colors">The Feed</Link></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Manifesto</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans font-bold">Connection</p>
              <ul className="space-y-3 font-serif text-gray-600 text-lg italic">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Substack</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-16 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-300 font-sans font-medium">
              © 2026 • A Spatial Repository
            </p>
            <div className="flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-gray-900 transition-colors">
                <Mail size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;