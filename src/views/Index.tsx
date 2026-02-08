"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasView from '@/components/CanvasView';
import FeedView from '@/components/FeedView';
import ReaderView from '@/components/ReaderView';
import FeedManager from '@/components/FeedManager';
import { Article } from '@/types/article';
import { useArticles } from '@/hooks/useArticles';
import { Loader2, RefreshCw, PlusCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { showSuccess, showError } from '@/utils/toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const ShelfContent = () => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const articleId = searchParams ? searchParams.get('article') : null;

    const [view, setView] = useState<'canvas' | 'feed'>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('open-shelf-view-mode');
                return (saved === 'feed' ? 'feed' : 'canvas');
            } catch {
                return 'canvas';
            }
        }
        return 'canvas';
    });

    useEffect(() => {
        localStorage.setItem('open-shelf-view-mode', view);
    }, [view]);

    const [isSyncing, setIsSyncing] = useState(false);
    const [onboardingChecked, setOnboardingChecked] = useState(false);
    const hasAttemptedInitialSync = useRef(false);

    const { data: articlesData, isLoading, refetch, fetchNextPage } = useArticles();

    const articles: Article[] = articlesData?.items || [];

    useEffect(() => {
        const checkOnboarding = async () => {
            if (authLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .single();

                if (error || !profileData?.onboarding_completed) {
                    router.push('/onboarding');
                } else {
                    setOnboardingChecked(true);
                }
            } catch (err) {
                router.push('/onboarding');
            }
        };
        checkOnboarding();
    }, [user, authLoading, router]);

    const selectedArticle = useMemo(() => {
        if (articles.length === 0 || !articleId) return null;
        return articles.find(a => a.id === articleId) || null;
    }, [articles, articleId]);

    const handleArticleClick = (article: Article) => {
        router.push(`/shelf?article=${article.id}`, { scroll: false });
    };

    const handleCloseReader = () => {
        router.push('/shelf', { scroll: false });
    };

    const syncFeeds = async (isAuto = false) => {
        if (isSyncing || !user) return;
        if (isAuto) hasAttemptedInitialSync.current = true;

        setIsSyncing(true);
        try {
            const { data: feeds } = await supabase
                .from('feeds')
                .select('url')
                .eq('user_id', user.id);

            if (feeds && feeds.length > 0) {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const promises = feeds.map(feed =>
                    fetch('/api/sync', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ feedUrl: feed.url })
                    })
                );

                await Promise.all(promises);
                if (!isAuto) showSuccess("Shelf updated");
                refetch();
            }
        } catch (err) {
            if (!isAuto) showError("Connection lost.");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (onboardingChecked && !isLoading && !hasAttemptedInitialSync.current && articles.length === 0) {
            syncFeeds(true);
        }
    }, [isLoading, onboardingChecked, articles.length]);

    if (authLoading || !onboardingChecked || (isLoading && articles.length === 0 && !isSyncing)) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background dark:bg-background space-y-4">
                <Loader2 className="animate-spin text-gray-200 dark:text-gray-700" size={32} />
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">Opening the shelf...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
                <div className="flex flex-col items-start cursor-pointer group" onClick={() => router.push('/')}>
                    <span className="text-[9px] uppercase tracking-[0.4em] font-sans font-bold text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">The</span>
                    <h1 className="text-xl font-serif font-medium tracking-tight text-gray-900 dark:text-gray-100">
                        Open Shelf
                    </h1>
                </div>

                <div className="flex items-center space-x-6">
                    <FeedManager onUpdate={refetch} />

                    <button onClick={() => syncFeeds(false)} disabled={isSyncing} className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        <RefreshCw className={isSyncing ? "animate-spin" : ""} size={14} />
                        <span>Sync</span>
                    </button>

                    <Tabs value={view} onValueChange={(v) => setView(v as 'canvas' | 'feed')}>
                        <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 rounded-none h-9">
                            <TabsTrigger value="canvas" className="text-[10px] uppercase tracking-widest px-4">Spatial</TabsTrigger>
                            <TabsTrigger value="feed" className="text-[10px] uppercase tracking-widest px-4">Grid</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <ThemeToggle />

                    <button
                        onClick={() => router.push('/profile')}
                        className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        title="Profile & Stacks"
                    >
                        <User size={16} />
                    </button>
                </div >
            </header >

            <main className="flex-1 mt-[73px] relative overflow-hidden">
                {articles.length > 0 ? (
                    view === 'canvas' && articlesData ? (
                        <CanvasView articles={articlesData} onArticleClick={handleArticleClick} onRefresh={fetchNextPage} />
                    ) : (
                        <div className="h-full overflow-y-auto subtle-grid">
                            <FeedView articles={articles} onArticleClick={handleArticleClick} />
                        </div>
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-6">
                        <div className="space-y-2">
                            <p className="text-gray-400 dark:text-gray-500 font-serif italic text-xl">
                                {isSyncing ? "Syncing your sources..." : "Your shelf is empty."}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 font-sans max-w-xs mx-auto">
                                {isSyncing
                                    ? "We're fetching the latest articles for you."
                                    : "Add an RSS feed via 'Manage Feeds' to start your collection."}
                            </p>
                        </div>
                        {!isSyncing && (
                            <FeedManager onUpdate={refetch} trigger={
                                <button className="flex items-center space-x-2 px-8 py-4 border border-gray-100 dark:border-gray-800 hover:border-gray-900 dark:hover:border-gray-100 transition-all text-[10px] uppercase tracking-[0.3em] font-bold">
                                    <PlusCircle size={16} />
                                    <span>Add First Source</span>
                                </button>
                            } />
                        )}
                        {isSyncing && <Loader2 className="animate-spin text-gray-100 dark:text-gray-800" size={24} />}
                    </div>
                )}
            </main>

            <ReaderView
                article={selectedArticle}
                onClose={handleCloseReader}
            />
        </div >
    );
};

export default function Index() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="animate-spin text-gray-200 dark:text-gray-700" size={32} />
            </div>
        }>
            <ShelfContent />
        </Suspense>
    );
}