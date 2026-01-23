"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Bookmark, FolderPlus, Trash2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import ArticleCard from '@/components/ArticleCard';
import { Article } from '@/types/article';

interface Stack {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface SavedArticle {
  id: string;
  article_id: string;
  stack_id: string;
  articles: Article;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStackName, setNewStackName] = useState('');
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [isCreatingStack, setIsCreatingStack] = useState(false);

  const fetchStacks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stacks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStacks(data || []);
      if (data && data.length > 0) {
        setSelectedStack(data[0].id);
      }
    } catch (err) {
      showError("Could not load your stacks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedArticles = async () => {
    if (!user || !selectedStack) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_articles')
        .select(`
          *,
          articles:articles (*)
        `)
        .eq('stack_id', selectedStack)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedArticles(data || []);
    } catch (err) {
      showError("Could not load saved articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
  }, [user]);

  useEffect(() => {
    if (selectedStack) {
      fetchSavedArticles();
    }
  }, [selectedStack, user]);

  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStackName.trim()) return;
    setIsCreatingStack(true);
    try {
      const { data, error } = await supabase
        .from('stacks')
        .insert({
          name: newStackName.trim(),
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      setStacks(prev => [data, ...prev]);
      setSelectedStack(data.id);
      setNewStackName('');
      showSuccess("Stack created");
    } catch (err) {
      showError("Could not create stack.");
    } finally {
      setIsCreatingStack(false);
    }
  };

  const handleDeleteStack = async (stackId: string) => {
    try {
      const { error } = await supabase
        .from('stacks')
        .delete()
        .eq('id', stackId);

      if (error) throw error;
      setStacks(prev => prev.filter(s => s.id !== stackId));
      if (selectedStack === stackId) {
        setSelectedStack(stacks.length > 1 ? stacks[1].id : null);
      }
      showSuccess("Stack removed");
    } catch (err) {
      showError("Could not remove stack.");
    }
  };

  const handleArticleClick = (article: Article) => {
    navigate(`/app/article/${article.id}`);
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex flex-col items-start cursor-pointer group" onClick={() => navigate('/app')}>
          <span className="text-[9px] uppercase tracking-[0.4em] font-sans font-bold text-gray-400 group-hover:text-gray-900 transition-colors">The</span>
          <h1 className="text-xl font-serif font-medium tracking-tight text-gray-900">
            Open Shelf
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={signOut} 
            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 mt-[73px] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-serif font-medium text-gray-900">Your Stacks</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans mt-1">Organize your saved articles</p>
          </div>

          <div className="p-6 space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-none border-gray-100 hover:border-gray-900 h-12 text-[10px] uppercase tracking-[0.3em] font-bold">
                  <Plus size={14} className="mr-2" />
                  New Stack
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-none border-gray-100">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl font-medium">Create New Stack</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStack} className="space-y-6 pt-6">
                  <Input
                    placeholder="e.g., Philosophy, Technology, Reading List"
                    value={newStackName}
                    onChange={(e) => setNewStackName(e.target.value)}
                    className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-900 h-12"
                  />
                  <Button type="submit" disabled={isCreatingStack} className="w-full rounded-none bg-gray-900 hover:bg-black h-12 text-[10px] uppercase tracking-[0.3em] font-bold">
                    {isCreatingStack ? 'Creating...' : 'Create Stack'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-2">
              {stacks.map(stack => (
                <div key={stack.id} className={`flex items-center justify-between p-3 rounded transition-colors ${selectedStack === stack.id ? 'bg-gray-50 border border-gray-200' : 'hover:bg-gray-50'}`}>
                  <button 
                    onClick={() => setSelectedStack(stack.id)}
                    className="flex-1 text-left overflow-hidden"
                  >
                    <p className="font-serif font-medium text-base text-gray-900 truncate">{stack.name}</p>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 truncate">
                      {savedArticles.filter(a => a.stack_id === stack.id).length} articles
                    </p>
                  </button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteStack(stack.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto subtle-grid">
          {selectedStack ? (
            <div className="p-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-medium text-gray-900">{stacks.find(s => s.id === selectedStack)?.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans mt-2">
                    {savedArticles.length} {savedArticles.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>
              </div>

              {savedArticles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-gray-400 font-serif italic text-xl">
                      This stack is empty.
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-300 font-sans max-w-xs mx-auto">
                      Save articles from the canvas or feed to organize your reading.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-8 space-y-8">
                  {savedArticles.map(item => (
                    <div key={item.id} className="break-inside-avoid">
                      <ArticleCard 
                        article={item.articles} 
                        onClick={handleArticleClick}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-6">
              <div className="space-y-2">
                <p className="text-gray-400 font-serif italic text-xl">
                  Create your first stack.
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 font-sans max-w-xs mx-auto">
                  Stacks help you organize and categorize your saved articles.
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2 px-8 py-4 border border-gray-100 hover:border-gray-900 transition-all text-[10px] uppercase tracking-[0.3em] font-bold">
                    <FolderPlus size={16} />
                    <span>Create First Stack</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-none border-gray-100">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl font-medium">Create New Stack</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateStack} className="space-y-6 pt-6">
                    <Input
                      placeholder="e.g., Philosophy, Technology, Reading List"
                      value={newStackName}
                      onChange={(e) => setNewStackName(e.target.value)}
                      className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-900 h-12"
                    />
                    <Button type="submit" disabled={isCreatingStack} className="w-full rounded-none bg-gray-900 hover:bg-black h-12 text-[10px] uppercase tracking-[0.3em] font-bold">
                      {isCreatingStack ? 'Creating...' : 'Create Stack'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;