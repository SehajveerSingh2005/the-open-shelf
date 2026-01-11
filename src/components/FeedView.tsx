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
    <div className="w-full max-w-5xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {articles.map(article => (
          <div key={article.id} className="w-full">
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