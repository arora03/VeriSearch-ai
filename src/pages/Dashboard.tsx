import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, HardDrive, Database, Plus, ArrowRight } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useNavigate } from 'react-router-dom';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const statCards = [
  {
    title: 'Documents Indexed',
    key: 'documentsIndexed' as const,
    icon: FileText,
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    title: 'Total Chats',
    key: 'totalChats' as const,
    icon: MessageSquare,
    gradient: 'from-accent/40 to-accent/10',
    iconColor: 'text-accent-foreground',
  },
  {
    title: 'Storage Used',
    key: 'storageUsed' as const,
    icon: HardDrive,
    gradient: 'from-secondary/60 to-secondary/20',
    iconColor: 'text-secondary-foreground',
    format: formatBytes,
  },
  {
    title: 'Datasets',
    key: 'datasetsCount' as const,
    icon: Database,
    gradient: 'from-ocean/20 to-ocean/5',
    iconColor: 'text-ocean-dark',
  },
];

export default function Dashboard() {
  const { theme, getStats, createChat } = useChatStore();
  const navigate = useNavigate();
  const stats = getStats();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleNewChat = () => {
    createChat();
    navigate('/chat');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Greeting Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <h1 className="font-display text-4xl font-bold lg:text-5xl">
                <span className="bg-gradient-to-r from-primary via-ocean-dark to-sage-dark bg-clip-text text-transparent">
                  Welcome to VeriSearch
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Your intelligent enterprise knowledge assistant
              </p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {statCards.map((card, index) => (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="glass-card group relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 ${card.iconColor}`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="mt-1 font-display text-3xl font-bold">
                        <AnimatedCounter
                          value={stats[card.key]}
                          formatFn={card.format || ((v) => Math.round(v).toString())}
                        />
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <button
                onClick={handleNewChat}
                className="glass-card group flex items-center gap-4 rounded-2xl border border-white/10 p-6 text-left shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
                  <Plus className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">Start New Chat</h3>
                  <p className="text-sm text-muted-foreground">Ask questions from your knowledge base</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('/datasets')}
                className="glass-card group flex items-center gap-4 rounded-2xl border border-white/10 p-6 text-left shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/40">
                  <Database className="h-7 w-7 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">Create Dataset</h3>
                  <p className="text-sm text-muted-foreground">Group documents into logical databases</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('/knowledge')}
                className="glass-card group flex items-center gap-4 rounded-2xl border border-white/10 p-6 text-left shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/60">
                  <FileText className="h-7 w-7 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">Upload Documents</h3>
                  <p className="text-sm text-muted-foreground">Add files to your knowledge base</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            {/* Empty State Hint */}
            {stats.documentsIndexed === 0 && stats.datasetsCount === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="glass-card rounded-2xl border border-white/10 p-8 text-center shadow-xl"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold">Get Started</h3>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  Upload documents to your Knowledge Base, then create a Dataset to group them. 
                  Once ready, start chatting to query your data intelligently.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button onClick={() => navigate('/knowledge')} className="btn-gradient-primary rounded-xl">
                    Upload Documents
                  </Button>
                  <Button onClick={() => navigate('/datasets')} variant="outline" className="rounded-xl">
                    Create Dataset
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
