"use client";

import React from 'react';
import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface FeedViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const FeedView = ({ articles, onArticleClick }: FeedViewProps) => {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {articles.map(article => (
          <div key={article.id} className="break-inside-avoid">
            <ArticleCard 
              article={article} 
              onClick={onArticleClick} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedView;