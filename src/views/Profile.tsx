"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut, Heart, Repeat, History, Bookmark, User as UserIcon, Settings } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import ArticleCard from '@/components/ArticleCard';
import { Article } from '@/types/article';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('likes');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (tab: string) => {
    if (!user) return;
    setLoading(true);
    try {
      let result;
      if (tab === 'likes') {
        result = await supabase
          .from('likes')
          .select('*, articles(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      } else if (tab === 'reposts') {
        result = await supabase
          .from('reposts')
          .select('*, articles(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      } else if (tab === 'activity') {
        result = await supabase
          .from('reading_activity')
          .select('*, articles(*)')
          .eq('user_id', user.id)
          .order('last_read_at', { ascending: false });
      } else if (tab === 'stacks') {
        result = await supabase
          .from('stacks')
          .select('*')
          .eq('user_id', user.id);
      }
      
      setData(result?.data || []);
    } catch (err) {
      showError("Could not load your collection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, user]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleArticleClick = (article: any) => {
    const art = article.articles || article; // Handle join results
    router.push(`/shelf?article=${art.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <button onClick={() => router.push('/shelf')} className="p-2 text-gray-400 hover:text-foreground"><ArrowLeft size={18} /></button>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">Library</span>
            <h1 className="text-xl font-serif font-medium tracking-tight">Personal Archive</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button onClick={handleLogout} className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 flex items-center space-x-2">
            <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[2000px] mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-background shadow-xl">
             <UserIcon size={40} className="text-gray-300" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-medium">{user?.email?.split('@')[0]}</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Collector of Thoughts</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center bg-transparent border-b rounded-none mb-12 h-14">
            <TabsTrigger value="likes" className="px-8 font-sans text-[11px] uppercase tracking-[0.2em] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground bg-transparent">
              <Heart size={14} className="mr-2" /> Likes
            </TabsTrigger>
            <TabsTrigger value="reposts" className="px-8 font-sans text-[11px] uppercase tracking-[0.2em] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground bg-transparent">
              <Repeat size={14} className="mr-2" /> Thoughts
            </TabsTrigger>
            <TabsTrigger value="activity" className="px-8 font-sans text-[11px] uppercase tracking-[0.2em] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground bg-transparent">
              <History size={14} className="mr-2" /> Recent
            </TabsTrigger>
            <TabsTrigger value="stacks" className="px-8 font-sans text-[11px] uppercase tracking-[0.2em] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground bg-transparent">
              <Bookmark size={14} className="mr-2" /> Stacks
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="flex justify-center py-20 opacity-20"><History className="animate-spin" size={32} /></div>
              ) : data.length === 0 ? (
                <div className="text-center py-24 space-y-4">
                  <p className="text-gray-400 font-serif italic text-xl">Your collection is waiting for you.</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Save articles while reading to see them here.</p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-8 space-y-8">
                  {data.map((item, i) => (
                    <div key={item.id || i} className="break-inside-avoid relative group">
                      {activeTab === 'reposts' && item.highlight_text && (
                        <div className="absolute -top-4 -left-4 z-10 w-full">
                          <div className="bg-gray-950 text-white p-4 text-[13px] font-serif italic shadow-2xl border border-white/10 rotate-[-1deg] group-hover:rotate-0 transition-transform">
                             "{item.highlight_text}"
                             {item.comment && (
                               <div className="mt-2 pt-2 border-t border-white/10 text-[10px] uppercase font-sans tracking-widest text-gray-400 not-italic">
                                 {item.comment}
                               </div>
                             )}
                          </div>
                        </div>
                      )}
                      <ArticleCard 
                        article={item.articles || item} 
                        onClick={() => handleArticleClick(item)} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;