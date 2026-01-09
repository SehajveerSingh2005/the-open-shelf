"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasView from '@/components/CanvasView';
import FeedView from '@/components/FeedView';
import ReaderView from '@/components/ReaderView';
import { Article } from '@/types/article';
import { useArticles } from '@/hooks/useArticles';
import { Loader2, RefreshCw, Plus, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [view, setView] = useState<'canvas' | 'feed'>('canvas');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  
  const { data: articles, isLoading, error, refetch } = useArticles();

  const syncFeeds = async () => {
    setIsSyncing(true);
    try {
      const { data: feeds } = await supabase.from('feeds').select('url');
      if (feeds && feeds.length > 0) {
        const promises = feeds.map(feed => 
          supabase.functions.invoke('fetch-rss', { 
            body: { feedUrl: feed.url } 
          })
        );
        
        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error);
        
        if (errors.length > 0) {
          showError("Some feeds could not be reached.");
        } else {
          showSuccess("Shelf updated with latest articles");
        }
        refetch();
      }
    } catch (err) {
      showError("Connection lost while syncing.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl) return;

    setIsAddingFeed(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { feedUrl: newFeedUrl }
      });

      if (error) throw error;
      
      showSuccess("New feed added successfully");
      setNewFeedUrl('');
      refetch();
    } catch (err: any) {
      showError(err.message || "Failed to add feed. Check the URL.");
    } finally {
      setIsAddingFeed(false);
    }
  };

  useEffect(() => {
    if (!isLoading && (!articles || articles.length === 0)) {
      syncFeeds();
    }
  }, [isLoading, articles?.length]);

  if (isLoading && !isSyncing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafafa] space-y-4">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Opening the shelf...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#fafafa] flex flex-col overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-serif font-medium tracking-tight text-gray-900">
          The Open Shelf
        </h1>
        
        <div className="flex items-center space-x-6">
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">
                <Plus size={14} />
                <span>Add Feed</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Add RSS Feed</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddFeed} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-serif italic">Enter the URL of an RSS or Atom feed.</p>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="https://example.com/feed" 
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      className="rounded-none border-gray-200"
                    />
                    <Button 
                      type="submit" 
                      disabled={isAddingFeed}
                      className="rounded-none bg-gray-900 hover:bg-gray-800"
                    >
                      {isAddingFeed ? <Loader2 className="animate-spin" size={16} /> : "Add"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <button 
            onClick={syncFeeds}
            disabled={isSyncing}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={isSyncing ? "animate-spin" : ""} size={14} />
            <span>{isSyncing ? "Syncing..." : "Sync All"}</span>
          </button>

          <div className="h-6 w-px bg-gray-100 mx-2" />

          <Tabs value={view} onValueChange={(v) => setView(v as 'canvas' | 'feed')}>
            <TabsList className="bg-gray-100/50 rounded-none h-9">
              <TabsTrigger value="canvas" className="text-[10px] uppercase tracking-widest px-4 h-7 data-[state=active]:bg-white data-[state=active]:shadow-none">Canvas</TabsTrigger>
              <TabsTrigger value="feed" className="text-[10px] uppercase tracking-widest px-4 h-7 data-[state=active]:bg-white data-[state=active]:shadow-none">Feed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="flex-1 mt-[73px] relative overflow-hidden">
        {isSyncing && (!articles || articles.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 text-gray-400">
            <Loader2 className="animate-spin" size={24} />
            <p className="font-serif italic">Collecting thoughts from across the web...</p>
          </div>
        ) : error ? (
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
              Your shelf is empty. Use "Add Feed" to start your collection.
            </p>
          </div>
        )}
      </main>

      <ReaderView 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />
    </div>
  );
};

export default Index;