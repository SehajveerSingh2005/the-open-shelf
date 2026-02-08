"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Layers } from 'lucide-react';
import { Article } from '@/types/article';
import { showSuccess, showError } from '@/utils/toast';

interface Stack {
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    created_at: string;
}

interface AddToStackProps {
    article: Article;
    children: React.ReactNode;
}

export function AddToStack({ article, children }: AddToStackProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [stacks, setStacks] = useState<Stack[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Create Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (user) fetchStacks();
            // Reset form when opening
            setCreating(false);
            setName('');
            setDescription('');
            setThumbnail(article.imageUrl || '');
        }
    }, [isOpen, user, article.imageUrl]);

    const fetchStacks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stacks')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setStacks(data);
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user) return;
        setLoading(true);

        // Create stack
        const { data, error } = await supabase
            .from('stacks')
            .insert({
                user_id: user.id,
                name,
                description,
                thumbnail: thumbnail || null
            })
            .select()
            .single();

        if (error) {
            console.error(error);
            showError("Failed to create stack");
            setLoading(false);
            return;
        }

        // Add current article to new stack immediately
        await addToStack(data.id, data.name);
    };

    const addToStack = async (stackId: string, stackName: string) => {
        if (!user) return;
        setLoading(true);
        const { error } = await supabase
            .from('stack_items')
            .insert({
                stack_id: stackId,
                article_id: article.id
            });

        if (error) {
            if (error.code === '23505') { // Unique violation
                showSuccess("Article already in stack");
                setIsOpen(false);
            } else {
                console.error(error);
                showError("Could not add to stack");
            }
        } else {
            showSuccess(`Added to ${stackName}`);
            setIsOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 p-0 overflow-hidden flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="font-serif text-2xl font-medium flex items-center justify-between">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={creating ? "create" : "list"}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                {creating ? "New Stack" : "Add to Stack"}
                            </motion.span>
                        </AnimatePresence>
                    </DialogTitle>
                </DialogHeader>

                <AnimatePresence mode="wait" initial={false}>
                    {creating ? (
                        <motion.div
                            key="create-form"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "tween", bounce: 1, ease: "easeInOut", duration: 0.2 }}
                            className="px-6 pb-6"
                        >
                            <form onSubmit={handleCreate} className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-gray-400">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Weekend Reads"
                                        className="font-serif text-lg border-gray-200 dark:border-gray-800 focus-visible:ring-0 focus:border-gray-900 dark:focus:border-gray-100"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs uppercase tracking-widest text-gray-400">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Collection description..."
                                        className="font-sans text-sm border-gray-200 dark:border-gray-800 focus-visible:ring-0 focus:border-gray-900 dark:focus:border-gray-100 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thumbnail" className="text-xs uppercase tracking-widest text-gray-400">Thumbnail URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="thumbnail"
                                            value={thumbnail}
                                            onChange={(e) => setThumbnail(e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1 font-mono text-xs border-gray-200 dark:border-gray-800 focus-visible:ring-0 focus:border-gray-900 dark:focus:border-gray-100"
                                        />
                                        {thumbnail && (
                                            <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-gray-100 border border-gray-200 relative">
                                                <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic">Defaults to current article image</p>
                                </div>

                                <div className="flex space-x-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setCreating(false)}
                                        className="flex-1 h-12 uppercase tracking-widest text-xs font-bold text-gray-500 hover:text-gray-900"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-black dark:hover:bg-white rounded-none h-12 uppercase tracking-widest text-xs font-bold"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Create & Add"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list-view"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="flex flex-col max-h-[60vh]"
                        >
                            <div className="px-6 pb-6 space-y-2 overflow-y-auto">
                                <button
                                    onClick={() => setCreating(true)}
                                    className="w-full flex items-center p-4 border border-dashed border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all group text-left mb-4"
                                >
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                        <Plus size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                                    </div>
                                    <div>
                                        <p className="font-serif font-medium text-gray-900 dark:text-gray-100">Create New Stack</p>
                                        <p className="text-xs text-gray-400">Start a new collection</p>
                                    </div>
                                </button>

                                <div className="space-y-2">
                                    {loading && stacks.length === 0 ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-gray-300" size={20} />
                                        </div>
                                    ) : stacks.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 italic font-serif text-sm">
                                            No stacks yet. Create one above.
                                        </div>
                                    ) : (
                                        stacks.map(stack => (
                                            <button
                                                key={stack.id}
                                                onClick={() => addToStack(stack.id, stack.name)}
                                                disabled={loading}
                                                className="w-full flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors text-left group rounded-sm"
                                            >
                                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 mr-4 shrink-0 overflow-hidden relative border border-gray-100 dark:border-gray-800">
                                                    {stack.thumbnail ? (
                                                        <img src={stack.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Layers size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-serif font-medium text-gray-900 dark:text-gray-100 truncate group-hover:underline decoration-gray-300 underline-offset-4">
                                                        {stack.name}
                                                    </p>
                                                    {stack.description && (
                                                        <p className="text-[10px] text-gray-400 truncate">{stack.description}</p>
                                                    )}
                                                </div>
                                                {loading && (
                                                    <Loader2 className="animate-spin text-gray-300 ml-2" size={14} />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
