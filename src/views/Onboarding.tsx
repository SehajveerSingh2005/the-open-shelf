"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ArrowRight, Loader2, Plus, Globe } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Onboarding = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Interests
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Step 2: Suggested Feeds
  const [suggestedFeeds, setSuggestedFeeds] = useState<any[]>([]);
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);

  // Step 3: Custom Feed
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    const { data } = await supabase.from('topics').select('*');
    if (data) setTopics(data);
  };

  const fetchSuggestedFeeds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('suggested_feeds')
      .select('*')
      .in('topic_id', topics.filter(t => selectedTopics.includes(t.slug)).map(t => t.id));

    if (data) {
      // Ensure unique feeds by URL
      const uniqueFeeds = Array.from(new Map(data.map(item => [item.url, item])).values());
      setSuggestedFeeds(uniqueFeeds);
      setSelectedFeeds(uniqueFeeds.map(f => f.url)); // Default select all
    }
    setLoading(false);
    setStep(2);
  };

  const toggleTopic = (slug: string) => {
    setSelectedTopics(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const toggleFeed = (url: string) => {
    setSelectedFeeds(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Add selected feeds - Using upsert to prevent 409 conflicts
      const feedsToAdd = suggestedFeeds
        .filter(f => selectedFeeds.includes(f.url))
        .map(f => ({
          url: f.url,
          title: f.title,
          user_id: user?.id
        }));

      if (feedsToAdd.length > 0) {
        // We use upsert with onConflict to handle cases where feeds might already exist for this user
        const { error: feedError } = await supabase
          .from('feeds')
          .upsert(feedsToAdd, { onConflict: 'url,user_id' });

        if (feedError) throw feedError;

        // Trigger sync for all added feeds
        for (const feed of feedsToAdd) {
          await supabase.functions.invoke('fetch-rss', {
            body: { feedUrl: feed.url }
          });
        }
      }

      // 2. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          interests: selectedTopics
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      showSuccess("Welcome to your shelf.");
      router.push('/shelf');
    } catch (err: any) {
      console.error("Onboarding error:", err);
      showError("Something went wrong finalizing your shelf.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustom = async (e: FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;

    if (suggestedFeeds.some(f => f.url === customUrl)) {
      showError("This source is already in your selection.");
      setCustomUrl('');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-rss', {
        body: { feedUrl: customUrl }
      });
      if (error) throw error;

      const { data: feedData } = await supabase.from('feeds').select('title').eq('url', customUrl).single();

      setSelectedFeeds(prev => [...prev, customUrl]);
      setSuggestedFeeds(prev => [...prev, { title: feedData?.title || 'Custom Source', url: customUrl }]);
      setCustomUrl('');
      showSuccess("Custom source added");
    } catch (err) {
      showError("Invalid RSS feed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4 text-center">
                <span className="text-[10px] uppercase tracking-[0.5em] font-sans font-bold text-gray-400">Step 01 / 02</span>
                <h2 className="text-4xl font-serif font-medium text-gray-900 leading-tight">
                  What defines your <br /><span className="italic">curiosity?</span>
                </h2>
                <p className="text-gray-400 font-serif italic text-base">Select the themes you wish to cultivate.</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {topics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.slug)}
                    className={`px-6 py-3 border transition-all duration-500 text-[10px] uppercase tracking-[0.3em] font-bold ${selectedTopics.includes(topic.slug)
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                      }`}
                  >
                    {topic.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={fetchSuggestedFeeds}
                  disabled={selectedTopics.length === 0 || loading}
                  className="rounded-none bg-white text-gray-900 border border-gray-100 hover:border-gray-900 hover:bg-white h-14 px-10 text-[10px] uppercase tracking-[0.4em] font-bold"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Next Step <ArrowRight size={14} className="ml-4" /></>}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4 text-center">
                <span className="text-[10px] uppercase tracking-[0.5em] font-sans font-bold text-gray-400">Step 02 / 02</span>
                <h2 className="text-4xl font-serif font-medium text-gray-900 leading-tight">
                  Seeding your <br /><span className="italic">collection.</span>
                </h2>
                <p className="text-gray-400 font-serif italic text-base">Sources gathered based on your interests.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {suggestedFeeds.map(feed => (
                  <button
                    key={feed.url}
                    onClick={() => toggleFeed(feed.url)}
                    className={`flex items-center justify-between p-4 border transition-all duration-300 ${selectedFeeds.includes(feed.url)
                      ? 'border-gray-900 bg-gray-50/50'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="text-left overflow-hidden">
                      <p className="font-serif font-medium text-base text-gray-900 truncate">{feed.title}</p>
                      <p className="text-[8px] uppercase tracking-widest text-gray-400 truncate w-full">{feed.url}</p>
                    </div>
                    {selectedFeeds.includes(feed.url) && <Check size={14} className="text-gray-900 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 text-center">Or add a custom source</p>
                <form onSubmit={handleAddCustom} className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <Input
                      placeholder="https://substack.com/feed"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="h-12 pl-12 rounded-none border-gray-100 focus:border-gray-900"
                    />
                  </div>
                  <Button type="submit" disabled={loading} variant="outline" className="h-12 rounded-none px-6 border-gray-100 hover:border-gray-900">
                    <Plus size={16} />
                  </Button>
                </form>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setStep(1)} className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400 hover:text-gray-900">Back</button>
                <Button
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="rounded-none bg-gray-900 text-white h-14 px-10 text-[10px] uppercase tracking-[0.4em] font-bold"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Complete Shelf"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;