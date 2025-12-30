"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasView from '@/components/CanvasView';
import FeedView from '@/components/FeedView';
import ReaderView from '@/components/ReaderView';
import { Article } from '@/types/article';
import { useArticles } from '@/hooks/useArticles';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [view, setView] = useState<'canvas' | 'feed'>('canvas');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const { data: articles, isLoading, error } = useArticles();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafafa] space-y-4">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Loading your shelf...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#fafafa] flex flex-col overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-serif font-medium tracking-tight text-gray-900">
          The Open Shelf
        </h1>
        
        <Tabs value={view} onValueChange={(v) => setView(v as 'canvas' | 'feed')}>
          <TabsList className="bg-gray-100/50">
            <TabsTrigger value="canvas" className="text-[10px] uppercase tracking-widest px-4">Canvas</TabsTrigger>
            <TabsTrigger value="feed" className="text-[10px] uppercase tracking-widest px-4">Feed</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mt-[73px] relative overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center text-gray-400 font-serif italic p-12 text-center">
            {error instanceof Error && error.message.includes('relation "articles" does not exist') 
              ? "Please run the SQL schema in your Supabase dashboard to set up the database."
              : "Something went wrong while loading articles."}
          </div>
        ) : articles && articles.length > 0 ? (
          view === 'canvas' ? (
            <CanvasView 
              articles={articles} 
              onArticleClick={setSelectedArticle} 
            />
          ) : (
            <div className="h-full overflow-y-auto subtle-grid">
              <FeedView 
                articles={articles} 
                onArticleClick={setSelectedArticle} 
              />
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 font-serif italic">
            Your shelf is currently empty. Add an RSS feed to begin.
          </div>
        )}
      </main>

      {/* Reader Overlay */}
      <ReaderView 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />
    </div>
  );
};

export default Index;