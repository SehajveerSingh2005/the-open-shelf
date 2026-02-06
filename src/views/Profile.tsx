"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FolderPlus, Trash2, LogOut, ArrowLeft, Bookmark } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const router = useRouter();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [newStackName, setNewStackName] = useState('');
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [isCreatingStack, setIsCreatingStack] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchStacks = async () => {
    if (!user) return;
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
    }
  };

  const fetchSavedArticles = async () => {
    if (!user || !selectedStack) return;
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

  const handleCreateStack = async (e: FormEvent) => {
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      showSuccess("Signed out successfully");
      router.push('/');
    } catch (err) {
      showError("Could not sign out.");
      setIsLoggingOut(false);
    }
  };

  const handleArticleClick = (article: Article) => {
    router.push(`/shelf?article=${article.id}`);
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => router.push('/shelf')}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title="Back to Shelf"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col items-start">
            <span className="text-[9px] uppercase tracking-[0.4em] font-sans font-bold text-gray-400 dark:text-gray-500">Your</span>
            <h1 className="text-xl font-serif font-medium tracking-tight text-gray-900 dark:text-gray-100">
              Profile & Stacks
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center space-x-2 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 mt-[73px] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-y-auto bg-white dark:bg-gray-950">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-2 mb-2">
              <Bookmark size={18} className="text-gray-400 dark:text-gray-500" />
              <h2 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100">Your Stacks</h2>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">Organize your saved articles</p>
          </div>

          <div className="p-6 space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-100 dark:bg-gray-900 dark:text-gray-100 h-12 text-[10px] uppercase tracking-[0.3em] font-bold">
                  <Plus size={14} className="mr-2" />
                  New Stack
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-none border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl font-medium text-gray-900 dark:text-gray-100">Create New Stack</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStack} className="space-y-6 pt-6">
                  <Input
                    placeholder="e.g., Philosophy, Technology, Reading List"
                    value={newStackName}
                    onChange={(e) => setNewStackName(e.target.value)}
                    className="rounded-none border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-900 dark:focus:border-gray-100 h-12"
                  />
                  <Button type="submit" disabled={isCreatingStack} className="w-full rounded-none bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-black h-12 text-[10px] uppercase tracking-[0.3em] font-bold">
                    {isCreatingStack ? 'Creating...' : 'Create Stack'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-2">
              {stacks.map(stack => (
                <div key={stack.id} className={`group flex items-center justify-between p-3 rounded transition-all ${selectedStack === stack.id
                    ? 'bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/30 border border-transparent'
                  }`}>
                  <button
                    onClick={() => setSelectedStack(stack.id)}
                    className="flex-1 text-left overflow-hidden"
                  >
                    <p className="font-serif font-medium text-base text-gray-900 dark:text-gray-100 truncate">{stack.name}</p>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">
                      {savedArticles.filter(a => a.stack_id === stack.id).length} articles
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteStack(stack.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all h-8 w-8"
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
                  <h2 className="text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">{stacks.find(s => s.id === selectedStack)?.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans mt-2">
                    {savedArticles.length} {savedArticles.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>
              </div>

              {savedArticles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-6 py-20">
                  <div className="space-y-2">
                    <Bookmark size={48} className="mx-auto text-gray-200 dark:text-gray-800" strokeWidth={1} />
                    <p className="text-gray-400 dark:text-gray-500 font-serif italic text-xl">
                      This stack is empty.
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 font-sans max-w-xs mx-auto">
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
                <FolderPlus size={48} className="mx-auto text-gray-200 dark:text-gray-800" strokeWidth={1} />
                <p className="text-gray-400 dark:text-gray-500 font-serif italic text-xl">
                  Create your first stack.
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 font-sans max-w-xs mx-auto">
                  Stacks help you organize and categorize your saved articles.
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 px-8 py-4 border border-gray-100 dark:border-gray-800 hover:border-gray-900 dark:hover:border-gray-100 transition-all text-[10px] uppercase tracking-[0.3em] font-bold">
                    <FolderPlus size={16} />
                    <span>Create First Stack</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-none border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl font-medium text-gray-900 dark:text-gray-100">Create New Stack</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateStack} className="space-y-6 pt-6">
                    <Input
                      placeholder="e.g., Philosophy, Technology, Reading List"
                      value={newStackName}
                      onChange={(e) => setNewStackName(e.target.value)}
                      className="rounded-none border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-900 dark:focus:border-gray-100 h-12"
                    />
                    <Button type="submit" disabled={isCreatingStack} className="w-full rounded-none bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-black h-12 text-[10px] uppercase tracking-[0.3em] font-bold">
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