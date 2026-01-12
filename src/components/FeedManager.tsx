"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Plus, Settings2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface Feed {
  id: string;
  url: string;
  title: string;
}

interface FeedManagerProps {
  onUpdate: () => void;
}

const FeedManager = ({ onUpdate }: FeedManagerProps) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchFeeds = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('feeds').select('*').order('created_at', { ascending: false });
    if (!error && data) setFeeds(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
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
      fetchFeeds();
      onUpdate();
    } catch (err: any) {
      showError("Could not connect to feed.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('feeds').delete().eq('id', id);
    if (error) {
      showError("Could not remove source.");
    } else {
      showSuccess("Source removed");
      fetchFeeds();
      onUpdate();
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">
          <Settings2 size={14} />
          <span>Manage Feeds</span>
        </button>
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
              className="rounded-none border-gray-200 focus-visible:ring-gray-900 h-12 flex-1"
            />
            <Button type="submit" disabled={adding} className="rounded-none bg-gray-900 hover:bg-black px-6 h-12">
              {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            </Button>
          </form>

          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-200" /></div>
            ) : feeds.length === 0 ? (
              <p className="text-center text-sm text-gray-400 font-serif italic py-4">No sources yet.</p>
            ) : (
              feeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-4 border border-gray-50 group hover:border-gray-200 transition-colors">
                  <div className="overflow-hidden">
                    <p className="font-serif font-medium truncate text-lg">{feed.title}</p>
                    <p className="text-[9px] text-gray-400 truncate uppercase tracking-widest">{feed.url}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(feed.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
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