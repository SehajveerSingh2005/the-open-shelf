"use client";

import { useState, useEffect, FormEvent, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Trash2,
  Plus,
  Settings2,
  Eye,
  EyeOff,
  Rss,
  Tag,
  Cpu,
  Microscope,
  Brain,
  BookOpen,
  Palette,
  Landmark,
  TrendingUp,
  Heart,
  Scroll,
  Globe,
  Activity,
  Leaf,
  LucideIcon
} from 'lucide-react';
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

interface Interest {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Predefined interest categories with lucide icons
const INTERESTS: Interest[] = [
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'science', label: 'Science', icon: Microscope },
  { id: 'philosophy', label: 'Philosophy', icon: Brain },
  { id: 'literature', label: 'Literature', icon: BookOpen },
  { id: 'art', label: 'Art & Design', icon: Palette },
  { id: 'politics', label: 'Politics', icon: Landmark },
  { id: 'economics', label: 'Economics', icon: TrendingUp },
  { id: 'psychology', label: 'Psychology', icon: Heart },
  { id: 'history', label: 'History', icon: Scroll },
  { id: 'culture', label: 'Culture', icon: Globe },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'environment', label: 'Environment', icon: Leaf },
];

const FeedManager = ({ onUpdate, trigger }: FeedManagerProps) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('sources');

  const fetchFeeds = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setFeeds(data);
    if (showLoading) setLoading(false);
  };

  // Load saved interests
  useEffect(() => {
    const loadInterests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      if (data?.interests) {
        setSelectedInterests(data.interests);
      }
    };
    loadInterests();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ feedUrl: newUrl })
      });

      if (!response.ok) throw new Error('Failed to add feed');

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
    setFeeds(prev => prev.map(f => f.id === id ? { ...f, is_hidden: !currentHidden } : f));

    const { error } = await supabase
      .from('feeds')
      .update({ is_hidden: !currentHidden })
      .eq('id', id);

    if (error) {
      showError("Could not update visibility.");
      fetchFeeds(false);
    } else {
      onUpdate();
    }
  };

  const toggleAll = async (hide: boolean) => {
    const originalFeeds = [...feeds];
    // Optimistic update
    setFeeds(prev => prev.map(f => ({ ...f, is_hidden: hide })));

    const { error } = await supabase
      .from('feeds')
      .update({ is_hidden: hide })
      .in('id', feeds.map(f => f.id));

    if (error) {
      showError("Could not update feeds.");
      setFeeds(originalFeeds);
    } else {
      onUpdate();
    }
  };

  // Check if all feeds are currently hidden
  const allHidden = feeds.length > 0 && feeds.every(f => f.is_hidden);

  const handleDelete = async (id: string) => {
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

  const toggleInterest = async (interestId: string) => {
    const newInterests = selectedInterests.includes(interestId)
      ? selectedInterests.filter(i => i !== interestId)
      : [...selectedInterests, interestId];

    setSelectedInterests(newInterests);

    // Save to profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ interests: newInterests })
      .eq('id', user.id);

    if (error) {
      showError("Could not save interests.");
      // Rollback
      setSelectedInterests(selectedInterests);
    } else {
      showSuccess("Interests updated");
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Settings2 size={14} />
            <span>Manage Feeds</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-none border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
          <DialogTitle className="font-serif text-4xl font-medium text-gray-900 dark:text-gray-100">Your Library</DialogTitle>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-serif italic pt-2">Curate your sources and interests</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-100 dark:border-gray-800 bg-transparent px-8 h-12 shrink-0">
            <TabsTrigger
              value="sources"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:bg-transparent px-6 font-sans text-[11px] uppercase tracking-[0.2em]"
            >
              <Rss size={14} className="mr-2" />
              Sources ({feeds.length})
            </TabsTrigger>
            <TabsTrigger
              value="interests"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:bg-transparent px-6 font-sans text-[11px] uppercase tracking-[0.2em]"
            >
              <Tag size={14} className="mr-2" />
              Interests ({selectedInterests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="flex-1 overflow-hidden px-8 pb-8 mt-0">
            <div className="space-y-6 pt-6">
              <form onSubmit={handleAdd} className="flex items-stretch space-x-2">
                <Input
                  placeholder="https://example.com/feed"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="rounded-none border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-900 dark:focus:border-gray-100 h-12 flex-1 transition-colors font-mono text-sm"
                />
                <Button type="submit" disabled={adding} className="rounded-none bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-black px-8 h-12 font-sans text-[10px] uppercase tracking-[0.2em]">
                  {adding ? <Loader2 className="animate-spin" size={16} /> : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </form>


              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">My Sources</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">({feeds.length})</span>
                </div>
                {feeds.length > 0 && (
                  <button
                    onClick={() => toggleAll(!allHidden)}
                    className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {allHidden ? (
                      <>
                        <Eye size={12} />
                        <span>Show All</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} />
                        <span>Hide All</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {loading && feeds.length === 0 ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-gray-200 dark:text-gray-700" size={32} />
                  </div>
                ) : feeds.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <Rss size={48} className="mx-auto text-gray-200 dark:text-gray-800" strokeWidth={1} />
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-serif italic">No sources yet. Add your first RSS feed above.</p>
                  </div>
                ) : (
                  feeds.map((feed) => (
                    <div
                      key={feed.id}
                      className={`group flex items-center justify-between p-5 border transition-all duration-200 ${feed.is_hidden
                        ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-50'
                        : 'bg-white dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                        }`}
                    >
                      <div className="overflow-hidden pr-4 flex-1">
                        <p className={`font-serif font-medium truncate text-lg transition-all ${feed.is_hidden
                          ? 'text-gray-400 dark:text-gray-500 line-through'
                          : 'text-gray-900 dark:text-gray-100'
                          }`}>
                          {feed.title}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate uppercase tracking-[0.15em] mt-1 font-mono">
                          {feed.url}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVisibility(feed.id, feed.is_hidden)}
                          className="text-gray-300 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors h-9 w-9"
                          title={feed.is_hidden ? "Show feed" : "Hide feed"}
                        >
                          {feed.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(feed.id)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors h-9 w-9"
                          title="Remove feed"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interests" className="flex-1 overflow-hidden px-8 pb-8 mt-0">
            <div className="space-y-6 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-serif italic">
                    Select topics that interest you to personalize your experience
                  </p>
                  {selectedInterests.length > 0 && (
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-sans font-bold">
                      {selectedInterests.length} selected
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                {INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  const IconComponent = interest.icon;
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`group relative p-5 border-2 transition-all duration-200 text-left ${isSelected
                        ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-900/50'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900/30'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent
                          size={24}
                          className={`transition-colors ${isSelected
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                            }`}
                          strokeWidth={1.5}
                        />
                        <div className="flex-1">
                          <p className={`font-serif font-medium text-base transition-colors ${isSelected
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                            }`}>
                            {interest.label}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center shrink-0">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white dark:text-black">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FeedManager;