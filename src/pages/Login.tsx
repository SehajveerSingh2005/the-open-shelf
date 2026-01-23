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
      <div className="hidden lg:flex flex-col justify-between p-20 bg-white border-r border-gray-50 relative overflow-hidden">
        {/* Super Minimal Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-10 w-[1px] h-32 bg-gray-100" />
          <div className="absolute bottom-1/4 right-10 w-[1px] h-32 bg-gray-100" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-gray-50 rounded-full opacity-50" />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          <span className="text-[11px] uppercase tracking-[0.6em] font-sans font-bold text-gray-300">The Open Shelf</span>
        </motion.div>

        <div className="relative z-10 max-w-md">
          <AnimatePresence mode="wait">
            {view === 'sign_in' ? (
              <motion.div
                key="signin-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <h1 className="text-7xl font-serif font-medium tracking-tight text-gray-900 leading-[0.95]">
                  Welcome back <br />
                  <span className="italic text-gray-400">to the shelf.</span>
                </h1>
                <p className="text-xl text-gray-500 font-serif leading-relaxed italic">
                  Your curated repository of ideas and slow media is waiting for your return.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <h1 className="text-7xl font-serif font-medium tracking-tight text-gray-900 leading-[0.95]">
                  Begin your <br />
                  <span className="italic text-gray-400">collection.</span>
                </h1>
                <p className="text-xl text-gray-500 font-serif leading-relaxed italic">
                  Create a space designed for depth, away from the noise of the vertical stream.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-sans font-medium">
            © 2024 • A Spatial Repository
          </p>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white relative">
        <div className="lg:hidden absolute top-8 left-8">
           <span className="text-[10px] uppercase tracking-[0.6em] font-sans font-bold text-gray-300">The Open Shelf</span>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-sm mx-auto space-y-10"
        >
          <div className="flex justify-center lg:justify-start space-x-8 border-b border-gray-50 pb-4">
            <button 
              onClick={() => setView('sign_in')}
              className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-colors ${view === 'sign_in' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setView('sign_up')}
              className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-colors ${view === 'sign_up' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
            >
              Create Account
            </button>
          </div>

          <div className="auth-container">
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
                      inputBorder: '#f3f4f6',
                      inputBorderFocus: '#111827',
                      inputBorderHover: '#e5e7eb',
                    },
                    radii: {
                      buttonRadius: '0px',
                      inputRadius: '0px',
                    },
                    fontSizes: {
                      baseBodySize: '15px',
                      baseInputSize: '16px',
                      baseLabelSize: '12px',
                      baseButtonSize: '12px',
                    }
                  },
                },
                className: {
                  container: 'space-y-6',
                  button: 'uppercase tracking-[0.3em] font-bold h-14 transition-all duration-300 border-gray-100 hover:border-gray-900 shadow-none',
                  input: 'h-14 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white',
                  label: 'uppercase tracking-widest text-[10px] text-gray-400 font-bold mb-2 block',
                  anchor: 'text-gray-400 hover:text-gray-900 font-serif italic text-sm transition-colors decoration-gray-200 underline-offset-4',
                  divider: 'bg-gray-50 my-8',
                  message: 'text-[11px] font-serif italic text-red-500 mt-2',
                }
              }}
              theme="light"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;