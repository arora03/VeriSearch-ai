import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, Database } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ThinkingIndicator } from './ThinkingIndicator';
import { EmptyChat } from './EmptyChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Message, Citation, ChartDataPoint } from '@/types/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendChatMessage, ingestDocument } from '@/lib/api';

// Mock AI responses for demo
const mockResponses: Record<string, { content: string; citations?: Citation[]; hasChart?: boolean; chartData?: ChartDataPoint[] }> = {
  leave: {
    content: "Based on our HR policies, employees are entitled to the following leave benefits:\n\n• **Annual Leave**: 20 days per year, accrued monthly\n• **Sick Leave**: 10 days per year, no carry-forward\n• **Personal Days**: 3 days per year\n• **Parental Leave**: 16 weeks for primary caregivers, 4 weeks for secondary\n\nLeave requests should be submitted at least 2 weeks in advance for planned absences.",
    citations: [
      { id: '1', fileName: 'Employee_Handbook.pdf', pageNumber: 12, excerpt: 'Annual leave entitlement begins at 20 days...' },
      { id: '2', fileName: 'Leave_Policy_2024.pdf', pageNumber: 3, excerpt: 'Parental leave provisions have been updated...' },
    ],
  },
  financial: {
    content: "Here's a summary of our Q4 financial performance:\n\n📈 **Revenue**: $12.4M (+18% YoY)\n📊 **Gross Margin**: 68% (up from 62%)\n💰 **Operating Income**: $3.2M\n🎯 **Customer Acquisition**: 245 new enterprise clients\n\nKey drivers include the new product launch and expansion into European markets.",
    citations: [
      { id: '1', fileName: 'Q4_Financial_Report.pdf', pageNumber: 5, excerpt: 'Total revenue reached $12.4 million...' },
    ],
    hasChart: true,
    chartData: [
      { name: 'Q1', value: 8.2 },
      { name: 'Q2', value: 9.1 },
      { name: 'Q3', value: 10.8 },
      { name: 'Q4', value: 12.4 },
    ],
  },
  sales: {
    content: "I've analyzed our sales data by region. Here are the key insights:\n\n🌎 **North America**: $5.2M (42% of total)\n🌍 **Europe**: $3.8M (31% of total)\n🌏 **Asia Pacific**: $2.4M (19% of total)\n🌐 **Other**: $1.0M (8% of total)\n\nEurope showed the highest growth at 32% YoY, driven by our new Frankfurt data center.",
    citations: [
      { id: '1', fileName: 'Sales_Data_2024.csv', pageNumber: 1, excerpt: 'Regional breakdown shows strong European growth...' },
    ],
    hasChart: true,
    chartData: [
      { name: 'N. America', value: 5.2 },
      { name: 'Europe', value: 3.8 },
      { name: 'APAC', value: 2.4 },
      { name: 'Other', value: 1.0 },
    ],
  },
  default: {
    content: "I've searched through your knowledge base and found relevant information. Based on the documents available, I can provide insights tailored to your organization's specific policies and data.\n\nWould you like me to elaborate on any particular aspect or search for more specific information?",
    citations: [
      { id: '1', fileName: 'Employee_Handbook.pdf', pageNumber: 1, excerpt: 'This handbook contains company policies...' },
    ],
  },
};

function getAIResponse(message: string): { content: string; citations?: Citation[]; hasChart?: boolean; chartData?: ChartDataPoint[] } {
  const lower = message.toLowerCase();
  if (lower.includes('leave') || lower.includes('vacation') || lower.includes('policy')) {
    return mockResponses.leave;
  }
  if (lower.includes('financial') || lower.includes('q4') || lower.includes('revenue')) {
    return mockResponses.financial;
  }
  if (lower.includes('sales') || lower.includes('region') || lower.includes('trend')) {
    return mockResponses.sales;
  }
  return mockResponses.default;
}

export function ChatInterface() {
  const { chats, activeChat, datasets, activeDataset, setActiveDataset, createChat, addMessage, updateMessage } = useChatStore();
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((c) => c.id === activeChat);
  const messages = currentChat?.messages || [];
  const selectedDs = datasets.find((ds) => ds.id === activeDataset);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (content: string) => {
    let chatId = activeChat;

    if (!chatId) {
      chatId = createChat();
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(chatId, userMessage);

    // Show thinking indicator
    setIsThinking(true);

    // Prepare AI message for streaming
    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    addMessage(chatId, aiMessage);

    // Build chat history - CRITICAL: Filter empty messages to prevent API errors
    const history = messages
      .filter(msg => msg.content && msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Local variable to track content to avoid closure staleness
    let fullContent = '';

    try {
      // Call real backend API with streaming
      await sendChatMessage(
        content,
        history,
        activeDataset || null,
        // onChunk - append content as it streams
        (chunk) => {
          fullContent += chunk;
          updateMessage(chatId!, aiMessage.id, {
            content: fullContent
          });
        },
        // onDone - finish streaming
        () => {
          // Handled after await
        },
        // onError
        (error) => {
          throw new Error(error);
        }
      );

      // Ensure specific cleanup always runs when connection closes
      setIsThinking(false);

      // If content is still empty after stream finishes, show error or fallback
      if (!fullContent || fullContent.trim() === '') {
        updateMessage(chatId!, aiMessage.id, {
          content: "(No response from AI. Please try again or check your connection.)",
          isStreaming: false
        });
      } else {
        updateMessage(chatId!, aiMessage.id, { isStreaming: false });
      }

    } catch (error) {
      setIsThinking(false);
      updateMessage(chatId!, aiMessage.id, {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isStreaming: false
      });
      toast.error('Chat Error', { description: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleFileUpload = (files: File[]) => {
    files.forEach((file) => {
      toast.success(`Uploading ${file.name}...`, {
        description: 'The file will be indexed and added to the current context.',
      });
    });

    // Simulate upload progress
    setTimeout(() => {
      toast.success('Upload Complete', {
        description: `${files.length} file(s) indexed and ready for queries.`,
      });
    }, 2000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Dataset Selector Bar */}
      <div className="border-b border-border bg-background/50 px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 rounded-xl">
              <Database className="h-4 w-4" />
              <span>{selectedDs?.icon || '📂'} {selectedDs?.name || 'Select Context'}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl" align="start">
            {datasets.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No datasets available. Create one first.
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
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!activeChat && messages.length === 0 ? (
        <div className="flex-1">
          <EmptyChat />
        </div>
      ) : (
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="mx-auto max-w-3xl space-y-4 py-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <AnimatePresence>
              {isThinking && <ThinkingIndicator />}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      <ChatInput
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        isLoading={isThinking}
      />
    </div>
  );
}
