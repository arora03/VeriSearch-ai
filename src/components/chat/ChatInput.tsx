import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (files: File[]) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, onFileUpload, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 border-t border-border bg-background/80 p-4 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        {/* File Upload - Multiple files */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.txt,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask whatever you want from your DB..."
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 pr-12 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200'
            )}
          />
        </div>

        {/* Send Button */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className={cn(
              'h-11 w-11 shrink-0 rounded-full p-0',
              message.trim() && !isLoading
                ? 'btn-gradient-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
