"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasView from '@/components/CanvasView';
import FeedView from '@/components/FeedView';
import ReaderView from '@/components/ReaderView';
import { Article } from '@/types/article';

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Architecture of Silence',
    author: 'Elena Rossi',
    source: 'Aeon',
    readingTime: '12 min read',
    publishedAt: 'Oct 24, 2023',
    excerpt: 'In the modern world, silence has become a luxury. We explore how minimalist design can restore our cognitive peace.',
    content: 'Silence is not merely the absence of sound. It is a presence in its own right...\n\nWhen we build spaces that invite quiet, we are building spaces that invite thought. The modern office, the open-plan home, the bustling city street—these are all environments designed for activity, but rarely for contemplation.',
    x: 100,
    y: 100
  },
  {
    id: '2',
    title: 'Why We Read Long-Form',
    author: 'Julian Barnes',
    source: 'The Browser',
    readingTime: '8 min read',
    publishedAt: 'Nov 2, 2023',
    excerpt: 'The neurological benefits of deep reading are being lost to the scroll. Here is why we must fight to keep them.',
    content: 'Deep reading is a specialized form of consciousness. It requires a specific kind of focus that the digital age is rapidly eroding...\n\nWhen you engage with an essay that spans thousands of words, you aren\'t just consuming information; you are co-creating a reality with the author.',
    x: 450,
    y: 200
  },
  {
    id: '3',
    title: 'The Lost Art of Letter Writing',
    author: 'Sarah Jenkins',
    source: 'Substack',
    readingTime: '15 min read',
    publishedAt: 'Dec 12, 2023',
    excerpt: 'A letter is a physical manifestation of time spent thinking about someone else. In an era of instant messaging, its value has skyrocketed.',
    content: 'There is a specific weight to a letter. It is the weight of intention. Unlike an email, which can be fired off in seconds, a letter demands a physical ritual...',
    x: 200,
    y: 400
  }
];

const Index = () => {
  const [view, setView] = useState<'canvas' | 'feed'>('canvas');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

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
        {view === 'canvas' ? (
          <CanvasView 
            articles={MOCK_ARTICLES} 
            onArticleClick={setSelectedArticle} 
          />
        ) : (
          <div className="h-full overflow-y-auto subtle-grid">
            <FeedView 
              articles={MOCK_ARTICLES} 
              onArticleClick={setSelectedArticle} 
            />
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