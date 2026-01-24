"use client";

import { useState, useEffect, FormEvent, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Plus, Settings2, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface Feed {
  id: string;
  url: string;
  title: string;
  is_hidden: boolean;
}

interface FeedManagerProps {
  onUpdate: () => void;
  trigger?: ReactNode;
}

const FeedManager = ({ onUpdate, trigger }: FeedManagerProps) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchFeeds = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setFeeds(data);
    if (showLoading) setLoading(false);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setAdding(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-rss', {
        body: { feedUrl: newUrl }
      });
      if (error) throw error;
      showSuccess("Source added to shelf");
      setNewUrl('');
      await fetchFeeds(false);
      onUpdate();
    } catch (err: any) {
      showError("Could not connect to feed.");
    } finally {
      setAdding(false);
    }
  };

  const toggleVisibility = async (id: string, currentHidden: boolean) => {
    // Optimistic UI update
    setFeeds(prev => prev.map(f => f.id === id ? { ...f, is_hidden: !currentHidden } : f));

    const { error } = await supabase
      .from('feeds')
      .update({ is_hidden: !currentHidden })
      .eq('id', id);

    if (error) {
      showError("Could not update visibility.");
      // Rollback on error
      fetchFeeds(false);
    } else {
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    const previousFeeds = [...feeds];
    setFeeds(prev => prev.filter(f => f.id !== id));

    const { error } = await supabase.from('feeds').delete().eq('id', id);
    if (error) {
      showError("Could not remove source.");
      setFeeds(previousFeeds);
    } else {
      showSuccess("Source removed");
      onUpdate();
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">
            <Settings2 size={14} />
            <span>Manage Feeds</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-none border-gray-100">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-medium">Your Library</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-6">
          <form onSubmit={handleAdd} className="flex items-stretch space-x-2">
            <Input 
              placeholder="https://example.com/feed" 
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-900 h-11 flex-1 transition-colors"
            />
            <Button type="submit" disabled={adding} className="rounded-none bg-gray-900 hover:bg-black px-6 h-11">
              {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            </Button>
          </form>

          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {loading && feeds.length === 0 ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-200" /></div>
            ) : feeds.length === 0 ? (
              <p className="text-center text-sm text-gray-400 font-serif italic py-8">No sources yet.</p>
            ) : (
              feeds.map((feed) => (
                <div key={feed.id} className={`flex items-center justify-between p-4 border transition-all duration-300 ${feed.is_hidden ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                  <div className="overflow-hidden pr-4">
                    <p className={`font-serif font-medium truncate text-lg transition-all ${feed.is_hidden ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{feed.title}</p>
                    <p className="text-[9px] text-gray-400 truncate uppercase tracking-widest">{feed.url}</p>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleVisibility(feed.id, feed.is_hidden)}
                      className="text-gray-300 hover:text-gray-900 transition-colors h-9 w-9"
                    >
                      {feed.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(feed.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors h-9 w-9"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedManager;