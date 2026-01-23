"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/app');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-6 relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-[400px] space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <span className="text-[10px] uppercase tracking-[0.6em] font-sans font-bold text-gray-400">The Open Shelf</span>
          <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight text-gray-900 leading-tight">
            Enter the <br />
            <span className="italic">workspace.</span>
          </h1>
        </div>

        <div className="bg-white/50 backdrop-blur-sm p-2 sm:p-4">
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
                container: 'space-y-4',
                button: 'uppercase tracking-[0.3em] font-bold h-12 transition-all duration-300 border-gray-100 hover:border-gray-900',
                input: 'h-12 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors',
                label: 'uppercase tracking-widest text-gray-400 font-bold mb-2',
                anchor: 'text-gray-400 hover:text-gray-900 font-serif italic text-sm transition-colors',
                divider: 'bg-gray-50',
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

        <div className="pt-8 border-t border-gray-50 text-center">
          <p className="text-[11px] text-gray-400 font-serif italic leading-relaxed">
            A non-linear repository for ideas, essays, and slow media. <br />
            Sign in to begin your collection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;