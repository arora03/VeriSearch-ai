import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, BarChart3 } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [citationsOpen, setCitationsOpen] = useState(false);
  const isUser = message.role === 'user';

  // Typewriter effect for AI messages
  // Removed broken typewriter effect that conflicted with streaming updates
  // The streaming content itself provides the natural typing visual
  useEffect(() => {
    setDisplayedText(message.content);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-muted text-foreground'
            : 'glass-card bg-secondary/50 backdrop-blur-xl'
        )}
      >
        {/* Message Content */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {displayedText}
          {message.isStreaming && (
            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary" />
          )}
        </p>

        {/* Chart Visualization */}
        {!isUser && message.hasChart && message.chartData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-xl bg-background/50 p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              Data Visualization
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={message.chartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCitationsOpen(!citationsOpen)}
              className="h-8 gap-2 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>📚</span>
              <span>Verified Sources ({message.citations.length})</span>
              {citationsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {citationsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 space-y-2"
              >
                {message.citations.map((citation) => (
                  <motion.div
                    key={citation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 rounded-xl bg-background/50 p-3 text-xs"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{citation.fileName}</p>
                      <p className="text-muted-foreground">
                        Page {citation.pageNumber}
                      </p>
                      <p className="mt-1 italic text-muted-foreground">
                        "{citation.excerpt}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
