"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasView from '@/components/CanvasView';
import FeedView from '@/components/FeedView';
import ReaderView from '@/components/ReaderView';
import { Article } from '@/types/article';
import { useArticles } from '@/hooks/useArticles';
import { Loader2, Plus, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Index = () => {
  const [view, setView] = useState<'canvas' | 'feed'>('canvas');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  
  const { data: articles, isLoading, error, refetch } = useArticles();

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl) return;

    setIsAddingFeed(true);
    try {
      // In a real implementation, you would call the Edge Function here:
      // await supabase.functions.invoke('fetch-rss', { body: { feedUrl: newFeedUrl } });
      
      // For now, let's simulate adding a feed entry
      const { error } = await supabase.from('feeds').insert([{ url: newFeedUrl }]);
      if (error) throw error;

      showSuccess("Feed added! It might take a moment to fetch articles.");
      setNewFeedUrl('');
      refetch();
    } catch (err: any) {
      showError(err.message || "Failed to add feed");
    } finally {
      setIsAddingFeed(false);
    }
  };

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
        
        <div className="flex items-center space-x-4">
          <form onSubmit={handleAddFeed} className="flex items-center space-x-2">
            <div className="relative">
              <Rss className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="url"
                placeholder="RSS URL..."
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                className="pl-9 h-9 w-48 lg:w-64 text-xs font-sans rounded-none border-gray-100 bg-gray-50/50 focus-visible:ring-gray-200"
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              disabled={isAddingFeed}
              className="rounded-none h-9 bg-gray-900 hover:bg-black text-[10px] uppercase tracking-widest px-4"
            >
              {isAddingFeed ? <Loader2 className="animate-spin" size={14} /> : "Add"}
            </Button>
          </form>

          <div className="h-6 w-px bg-gray-100 mx-2 hidden md:block" />

          <Tabs value={view} onValueChange={(v) => setView(v as 'canvas' | 'feed')}>
            <TabsList className="bg-gray-100/50 rounded-none h-9">
              <TabsTrigger value="canvas" className="text-[10px] uppercase tracking-widest px-4 h-7 data-[state=active]:bg-white data-[state=active]:shadow-none">Canvas</TabsTrigger>
              <TabsTrigger value="feed" className="text-[10px] uppercase tracking-widest px-4 h-7 data-[state=active]:bg-white data-[state=active]:shadow-none">Feed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mt-[73px] relative overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center text-gray-400 font-serif italic p-12 text-center">
            Something went wrong while loading articles.
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
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <p className="font-serif italic text-lg text-center max-w-sm">
              Your shelf is empty. Paste an RSS URL above to begin your spatial collection.
            </p>
            <div className="flex space-x-4 opacity-50 grayscale">
              <span className="text-[10px] uppercase tracking-widest">Aeon</span>
              <span className="text-[10px] uppercase tracking-widest">The Browser</span>
              <span className="text-[10px] uppercase tracking-widest">Substack</span>
            </div>
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