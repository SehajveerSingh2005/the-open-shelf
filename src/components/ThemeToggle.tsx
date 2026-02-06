"use client";

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {theme === 'light' ? (
                    <Moon size={18} className="text-gray-600" />
                ) : (
                    <Sun size={18} className="text-gray-400" />
                )}
            </motion.div>
        </Button>
    );
}
