"use client";

import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');

  useEffect(() => {
    if (session) {
      navigate('/app');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white selection:bg-gray-100 selection:text-black">
      {/* Editorial Side */}
      <div className="hidden lg:flex flex-col justify-between p-20 relative overflow-hidden bg-[#0a0a0a] text-white">
        {/* Background Images with Snappy Editorial Crossfade */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut" 
              }}
              className="absolute inset-0"
            >
              <img 
                src={view === 'sign_in' ? '/login.jpg' : '/signup.jpg'} 
                alt="Background" 
                className="w-full h-full object-cover grayscale-[10%]"
              />
              <div className="absolute inset-0 bg-black/40" />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          <span className="text-[11px] uppercase tracking-[0.6em] font-sans font-bold text-white/90">The Open Shelf</span>
        </motion.div>

        <div className="relative z-10 max-w-md text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <h1 className="text-7xl font-serif font-medium tracking-tight leading-[0.95]">
                {view === 'sign_in' ? (
                  <>Welcome back <br /><span className="italic text-white/60">to the shelf.</span></>
                ) : (
                  <>Begin your <br /><span className="italic text-white/60">collection.</span></>
                )}
              </h1>
              <p className="text-xl text-white/80 font-serif leading-relaxed italic">
                {view === 'sign_in' 
                  ? "Your curated repository of ideas and slow media is waiting."
                  : "Create a space designed for depth, away from the noise."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-sans font-medium">
            © 2024 • A Spatial Repository
          </p>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="lg:hidden absolute top-8 left-8">
           <span className="text-[10px] uppercase tracking-[0.6em] font-sans font-bold text-gray-300">The Open Shelf</span>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="flex justify-center lg:justify-start space-x-10 border-b border-gray-100 pb-4">
            <button 
              onClick={() => setView('sign_in')}
              className={`text-[11px] uppercase tracking-[0.2em] font-bold transition-all ${view === 'sign_in' ? 'text-gray-900 border-b-2 border-gray-900 pb-4 -mb-[18px]' : 'text-gray-300 hover:text-gray-500'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setView('sign_up')}
              className={`text-[11px] uppercase tracking-[0.2em] font-bold transition-all ${view === 'sign_up' ? 'text-gray-900 border-b-2 border-gray-900 pb-4 -mb-[18px]' : 'text-gray-300 hover:text-gray-500'}`}
            >
              Create Account
            </button>
          </div>

          {/* Added a min-height and overflow-hidden to keep the layout stable during transitions */}
          <div className="auth-container min-h-[420px]">
            <Auth
              supabaseClient={supabase}
              providers={['google']}
              view={view}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#111827',
                      brandAccent: '#000000',
                      inputBackground: 'transparent',
                      inputText: '#111827',
                      inputPlaceholder: '#9ca3af',
                      inputBorder: '#d1d5db',
                      inputBorderFocus: '#111827',
                      inputBorderHover: '#9ca3af',
                    },
                    radii: {
                      buttonRadius: '0px',
                      inputRadius: '0px',
                    },
                    fontSizes: {
                      baseBodySize: '15px',
                      baseInputSize: '16px',
                      baseLabelSize: '13px',
                      baseButtonSize: '12px',
                    }
                  },
                },
                className: {
                  container: 'space-y-4',
                  button: 'uppercase tracking-[0.3em] font-bold h-14 transition-all duration-300 border-gray-200 hover:border-gray-900 shadow-none mt-4',
                  input: 'h-14 border-gray-200 focus:ring-0 focus:border-gray-900 transition-colors bg-white',
                  label: 'text-sm font-medium text-gray-700 mb-2 block',
                  anchor: 'text-gray-400 hover:text-gray-900 font-serif italic text-sm transition-colors decoration-gray-200 underline-offset-4',
                  divider: 'bg-gray-100 my-8',
                  message: 'text-[12px] font-serif italic text-red-500 mt-2',
                }
              }}
              theme="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;