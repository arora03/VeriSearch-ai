import { Sun, Moon, Sparkles } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { datasets, activeDataset, theme, toggleTheme } = useChatStore();
  const selectedDs = datasets.find((ds) => ds.id === activeDataset);
  const location = useLocation();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-300 to-indigo-300 shadow-sm"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <span className="font-display text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">VeriSearch</span>
        </Link>

        {(location.pathname === '/chat' || location.pathname === '/chats') && selectedDs && (
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span className="text-foreground/30">|</span>
            <span>{selectedDs.icon}</span>
            <span>{selectedDs.name}</span>
          </div>
        )}
      </div>

      <nav className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-xl"
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'light' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </motion.div>
        </Button>
      </nav>
    </header>
  );
}
