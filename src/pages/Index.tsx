"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasView from '@/components/CanvasView';
import FeedView from '@/components/FeedView';
import ReaderView from '@/components/ReaderView';
import FeedManager from '@/components/FeedManager';
import { Article } from '@/types/article';
import { useArticles } from '@/hooks/useArticles';
import { Loader2, RefreshCw, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Index = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const [view, setView] = useState<'canvas' | 'feed'>('canvas');
  const [isSyncing, setIsSyncing] = useState(false);
  const hasAttemptedInitialSync = useRef(false);
  
  const { data: articlesData, isLoading, error, refetch } = useArticles();

  const selectedArticle = useMemo(() => {
    if (!articlesData?.items || !articleId) return null;
    return articlesData.items.find(a => a.id === articleId) || null;
  }, [articlesData, articleId]);

  const handleArticleClick = (article: Article) => {
    navigate(`/app/article/${article.id}`);
  };

  const handleCloseReader = () => {
    navigate('/app');
  };

  const syncFeeds = async (isAuto = false) => {
    // If it's an auto-sync and we've already tried, or if we're already syncing, skip
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const { data: feeds } = await supabase.from('feeds').select('url');
      
      if (feeds && feeds.length > 0) {
        const promises = feeds.map(feed => 
          supabase.functions.invoke('fetch-rss', { 
            body: { feedUrl: feed.url } 
          })
        );
        
        await Promise.all(promises);
        if (!isAuto) showSuccess("Shelf updated");
        refetch();
      }
    } catch (err) {
      if (!isAuto) showError("Connection lost.");
    } finally {
      setIsSyncing(false);
      if (isAuto) hasAttemptedInitialSync.current = true;
    }
  };

  useEffect(() => {
    // Only attempt auto-sync once if the shelf is empty and we haven't tried yet
    if (!isLoading && !hasAttemptedInitialSync.current && (!articlesData?.items || articlesData.items.length === 0)) {
      syncFeeds(true);
    }
  }, [isLoading, articlesData?.items?.length]);

  // Only show the full-screen loader on the very first load
  if (isLoading && !articlesData?.items && !isSyncing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafafa] space-y-4">
        <Loader2 className="animate-spin text-gray-200" size={32} />
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Opening the shelf...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex flex-col items-start cursor-pointer group" onClick={() => navigate('/')}>
          <span className="text-[9px] uppercase tracking-[0.4em] font-sans font-bold text-gray-400 group-hover:text-gray-900 transition-colors">The</span>
          <h1 className="text-xl font-serif font-medium tracking-tight text-gray-900">
            Open Shelf
          </h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <FeedManager onUpdate={refetch} />

          <button onClick={() => syncFeeds(false)} disabled={isSyncing} className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">
            <RefreshCw className={isSyncing ? "animate-spin" : ""} size={14} />
            <span>Sync</span>
          </button>

          <Tabs value={view} onValueChange={(v) => setView(v as 'canvas' | 'feed')}>
            <TabsList className="bg-gray-100/50 rounded-none h-9">
              <TabsTrigger value="canvas" className="text-[10px] uppercase tracking-widest px-4">Canvas</TabsTrigger>
              <TabsTrigger value="feed" className="text-[10px] uppercase tracking-widest px-4">Feed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="flex-1 mt-[73px] relative overflow-hidden">
        {articlesData?.items && articlesData.items.length > 0 ? (
          view === 'canvas' ? (
            <CanvasView articles={articlesData} onArticleClick={handleArticleClick} />
          ) : (
            <div className="h-full overflow-y-auto subtle-grid">
              <FeedView articles={articlesData.items} onArticleClick={handleArticleClick} />
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-6">
            <div className="space-y-2">
              <p className="text-gray-400 font-serif italic text-xl">
                {isSyncing ? "Syncing your sources..." : "Your shelf is empty."}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-gray-300 font-sans max-w-xs mx-auto">
                {isSyncing 
                  ? "We're fetching the latest articles for you." 
                  : "Add an RSS feed via 'Manage Feeds' to start your collection."}
              </p>
            </div>
            {!isSyncing && (
              <FeedManager onUpdate={refetch} />
            )}
            {isSyncing && <Loader2 className="animate-spin text-gray-100" size={24} />}
          </div>
        )}
      </main>

      <ReaderView 
        article={selectedArticle} 
        onClose={handleCloseReader} 
      />
    </div>
  );
};

export default Index;