import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  LayoutDashboard,
  Server,
  FileText,
  BarChart3,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/datasets', label: 'My Datasets', icon: Server },
  { path: '/knowledge', label: 'Knowledge Base', icon: FileText },
  { path: '/chat', label: 'Chats', icon: MessageSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const {
    chats,
    activeChat,
    datasets,
    activeDataset,
    sidebarCollapsed,
    createChat,
    setActiveChat,
    deleteChat,
    setActiveDataset,
    toggleSidebar,
  } = useChatStore();

  const location = useLocation();
  const navigate = useNavigate();
  const selectedDs = datasets.find((ds) => ds.id === activeDataset);

  const groupedChats = {
    today: chats.filter((c) => isToday(new Date(c.updatedAt))),
    yesterday: chats.filter((c) => isYesterday(new Date(c.updatedAt))),
    lastWeek: chats.filter((c) => {
      const date = new Date(c.updatedAt);
      return (
        isAfter(date, subDays(new Date(), 7)) &&
        !isToday(date) &&
        !isYesterday(date)
      );
    }),
    older: chats.filter((c) => !isAfter(new Date(c.updatedAt), subDays(new Date(), 7))),
  };

  const handleNewChat = () => {
    createChat();
    navigate('/chat');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Dataset Selector */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between gap-2 rounded-2xl border-border bg-background/50"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{selectedDs?.icon || '📂'}</span>
                      <span className="truncate">{selectedDs?.name || 'Select Dataset'}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl bg-popover" align="start">
                  {datasets.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No datasets created yet
                    </div>
                  ) : (
                    datasets.map((ds) => (
                      <DropdownMenuItem
                        key={ds.id}
                        onClick={() => setActiveDataset(ds.id)}
                        className={cn(
                          'cursor-pointer rounded-lg',
                          ds.id === activeDataset && 'bg-accent'
                        )}
                      >
                        <span className="mr-2">{ds.icon}</span>
                        <span>{ds.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {ds.documentIds.length} docs
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg"
                    onClick={() => navigate('/datasets')}
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Manage Datasets
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>

        {sidebarCollapsed && (
          <div className="flex justify-center">
            <span className="text-xl">{selectedDs?.icon || '📂'}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-2 pb-2">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 rounded-xl mb-1',
                sidebarCollapsed && 'justify-center px-0',
                location.pathname === item.path && 'bg-accent'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleNewChat}
          className={cn(
            'btn-gradient-primary w-full rounded-2xl font-medium gap-2',
            sidebarCollapsed && 'px-0'
          )}
        >
          <Plus className="h-4 w-4" />
          {!sidebarCollapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pb-4"
            >
              {groupedChats.today.length > 0 && (
                <ChatGroup title="Today" chats={groupedChats.today} activeChat={activeChat} onSelect={(id) => { setActiveChat(id); navigate('/chat'); }} onDelete={deleteChat} />
              )}
              {groupedChats.yesterday.length > 0 && (
                <ChatGroup title="Yesterday" chats={groupedChats.yesterday} activeChat={activeChat} onSelect={(id) => { setActiveChat(id); navigate('/chat'); }} onDelete={deleteChat} />
              )}
              {groupedChats.lastWeek.length > 0 && (
                <ChatGroup title="Last 7 Days" chats={groupedChats.lastWeek} activeChat={activeChat} onSelect={(id) => { setActiveChat(id); navigate('/chat'); }} onDelete={deleteChat} />
              )}
              {groupedChats.older.length > 0 && (
                <ChatGroup title="Older" chats={groupedChats.older} activeChat={activeChat} onSelect={(id) => { setActiveChat(id); navigate('/chat'); }} onDelete={deleteChat} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.aside>
  );
}

function ChatGroup({
  title,
  chats,
  activeChat,
  onSelect,
  onDelete,
}: {
  title: string;
  chats: any[];
  activeChat: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">
        {chats.map((chat) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative"
          >
            <button
              onClick={() => onSelect(chat.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                activeChat === chat.id && 'bg-accent'
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{chat.title}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
