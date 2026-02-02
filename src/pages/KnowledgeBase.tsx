import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Search,
  MoreVertical,
  Trash2,
  RefreshCw,
  Check,
  Loader2,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Document } from '@/types/chat';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  txt: FileText,
  docx: FileText,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getStatusColor(status: Document['status']) {
  switch (status) {
    case 'uploading':
      return 'bg-blue-500';
    case 'indexing':
      return 'bg-yellow-500 animate-pulse';
    case 'ready':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
  }
}

function getStatusIcon(status: Document['status']) {
  switch (status) {
    case 'uploading':
    case 'indexing':
      return <Loader2 className="h-3 w-3 animate-spin" />;
    case 'ready':
      return <Check className="h-3 w-3" />;
    case 'error':
      return <span className="text-xs">!</span>;
  }
}

export default function KnowledgeBase() {
  const { documents, addDocument, updateDocument, deleteDocument } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => handleUpload(file));
  };

  const handleUpload = async (file: File) => {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.name.split('.').pop() as Document['type'],
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date(),
      size: file.size,
    };

    addDocument(newDoc);

    try {
      // Actually upload to backend
      const { ingestDocument } = await import('@/lib/api');

      // Update status to indexing
      updateDocument(newDoc.id, { status: 'indexing', progress: undefined });

      const response = await ingestDocument(file);

      // Success - document is indexed
      updateDocument(newDoc.id, {
        status: 'ready',
        id: response.doc_id // Use the backend-generated doc_id
      });

      toast.success('Document Uploaded!', {
        description: `${file.name} has been indexed and is now searchable. (${response.chunks_processed} chunks processed)`,
      });
    } catch (error) {
      // Error handling
      updateDocument(newDoc.id, { status: 'error' });
      toast.error('Upload Failed', {
        description: error instanceof Error ? error.message : 'Failed to upload document',
      });
      console.error('Upload error:', error);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const doc = documents.find((d) => d.id === deleteTarget);
    deleteDocument(deleteTarget);
    setDeleteTarget(null);
    toast.success('Document deleted', { description: `"${doc?.name}" has been removed.` });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="font-display text-3xl font-bold">Knowledge Base</h1>
              <p className="mt-1 text-muted-foreground">
                Upload and manage all your documents here
              </p>
            </motion.div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl pl-10"
                />
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.csv,.txt,.docx,.xlsx,.xls"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(handleUpload);
                  }}
                />
                <Button asChild className="btn-gradient-primary rounded-xl gap-2">
                  <span>
                    <Upload className="h-4 w-4" />
                    Upload Documents
                  </span>
                </Button>
              </label>
            </div>

            {/* Drop Zone / Documents Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={cn(
                'relative min-h-[400px] rounded-3xl border-2 border-dashed transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card/50'
              )}
            >
              {isDragging && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-primary/5 backdrop-blur-sm">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-primary" />
                    <p className="mt-2 text-lg font-medium">Drop files here</p>
                  </div>
                </div>
              )}

              {filteredDocs.length === 0 ? (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No documents yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Upload PDFs, CSVs, or text files to start building your knowledge base.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDocs.map((doc, index) => {
                    const Icon = fileTypeIcons[doc.type] || FileText;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group glass-card relative overflow-hidden rounded-2xl border border-white/10 p-4 shadow-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium w-full" title={doc.name}>{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.size)}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem className="cursor-pointer gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Re-index
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-destructive"
                                onClick={() => setDeleteTarget(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Status & Progress */}
                        <div className="mt-4">
                          {doc.status === 'uploading' && doc.progress !== undefined && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Uploading...</span>
                                <span>{doc.progress}%</span>
                              </div>
                              <Progress value={doc.progress} className="h-1.5" />
                            </div>
                          )}
                          {doc.status !== 'uploading' && (
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full text-white',
                                  getStatusColor(doc.status)
                                )}
                              >
                                {getStatusIcon(doc.status)}
                              </div>
                              <span className="text-xs capitalize text-muted-foreground">
                                {doc.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This will delete the embeddings permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </div>
  );
}
