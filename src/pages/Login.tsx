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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] uppercase tracking-[0.6em] font-sans font-bold text-gray-400">The Open Shelf</span>
          <h1 className="text-4xl font-serif font-medium tracking-tight text-gray-900 italic">Welcome back.</h1>
        </div>

        <div className="border border-gray-100 p-8">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#111827',
                    brandAccent: '#000000',
                  },
                  radii: {
                    buttonRadius: '0px',
                    inputRadius: '0px',
                  }
                },
              },
            }}
            theme="light"
          />
        </div>

        <p className="text-center text-[11px] text-gray-400 font-serif italic">
          Sign in to access your curated digital library.
        </p>
      </div>
    </div>
  );
};

export default Login;