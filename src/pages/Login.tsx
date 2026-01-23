"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/app');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white selection:bg-gray-100 selection:text-black">
      {/* Branding Side (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-[#fafafa] border-r border-gray-100 relative overflow-hidden">
        {/* Subtle Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <span className="text-[11px] uppercase tracking-[0.6em] font-sans font-bold text-gray-400">The Open Shelf</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-xl"
        >
          <h1 className="text-7xl xl:text-8xl font-serif font-medium tracking-tight text-gray-900 leading-[0.9]">
            A space for <br />
            <span className="italic">the profound.</span>
          </h1>
          <p className="mt-12 text-xl text-gray-500 font-serif leading-relaxed italic max-w-md">
            "We believe that how you organize your digital consumption changes how you think."
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-sans font-medium">
            © 2024 • A Spatial Repository
          </p>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 bg-white relative">
        <div className="lg:hidden absolute top-8 left-8">
           <span className="text-[10px] uppercase tracking-[0.6em] font-sans font-bold text-gray-400">The Open Shelf</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto space-y-12"
        >
          <div className="space-y-4">
            <h2 className="text-4xl font-serif font-medium tracking-tight text-gray-900">
              Enter the workspace.
            </h2>
            <p className="text-gray-400 font-serif italic text-lg">
              Sign in to access your curated digital library.
            </p>
          </div>

          <div className="auth-container">
            <Auth
              supabaseClient={supabase}
              providers={['google']}
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
                      inputBorder: '#e5e7eb',
                      inputBorderFocus: '#111827',
                      inputBorderHover: '#9ca3af',
                    },
                    radii: {
                      buttonRadius: '0px',
                      inputRadius: '0px',
                    },
                    fonts: {
                      bodyFontFamily: `'Instrument Sans', sans-serif`,
                      buttonFontFamily: `'Instrument Sans', sans-serif`,
                      inputFontFamily: `'Instrument Sans', sans-serif`,
                      labelFontFamily: `'Instrument Sans', sans-serif`,
                    },
                    fontSizes: {
                      baseBodySize: '13px',
                      baseInputSize: '14px',
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
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Electronic Mail',
                    password_label: 'Access Key',
                    button_label: 'Enter Shelf',
                    social_provider_text: 'Continue with {{provider}}',
                  },
                  sign_up: {
                    email_label: 'Electronic Mail',
                    password_label: 'Access Key',
                    button_label: 'Initialize Account',
                    social_provider_text: 'Continue with {{provider}}',
                  },
                },
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;