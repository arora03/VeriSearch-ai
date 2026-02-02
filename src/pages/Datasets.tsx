import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Plus,
  Trash2,
  FileText,
  Search,
  FolderOpen,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dataset } from '@/types/chat';

const iconOptions = ['📁', '📊', '📈', '👥', '💼', '🏢', '📋', '🔬'];

export default function Datasets() {
  const { datasets, documents, addDataset, deleteDataset, addDocumentToDataset, removeDocumentFromDataset } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  
  // New dataset form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('📁');

  const filteredDatasets = datasets.filter((ds) =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Please enter a dataset name');
      return;
    }
    const dataset: Dataset = {
      id: crypto.randomUUID(),
      name: newName,
      description: newDescription,
      documentIds: [],
      icon: newIcon,
      createdAt: new Date(),
    };
    addDataset(dataset);
    setIsCreateOpen(false);
    setNewName('');
    setNewDescription('');
    setNewIcon('📁');
    toast.success('Dataset created', { description: `"${newName}" is ready for documents.` });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const ds = datasets.find((d) => d.id === deleteTarget);
    deleteDataset(deleteTarget);
    setDeleteTarget(null);
    toast.success('Dataset deleted', { description: `"${ds?.name}" and its embeddings have been removed.` });
  };

  const handleToggleDocument = (datasetId: string, documentId: string, isInDataset: boolean) => {
    if (isInDataset) {
      removeDocumentFromDataset(datasetId, documentId);
    } else {
      addDocumentToDataset(datasetId, documentId);
    }
  };

  const selectedDs = datasets.find((ds) => ds.id === selectedDataset);
  const availableDocs = documents.filter((doc) => doc.status === 'ready');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h1 className="font-display text-3xl font-bold">My Datasets</h1>
                <p className="mt-1 text-muted-foreground">
                  Group documents into logical databases for targeted queries
                </p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-gradient-primary rounded-xl gap-2">
                    <Plus className="h-4 w-4" />
                    Create Dataset
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Dataset</DialogTitle>
                    <DialogDescription>
                      Group related documents together for focused queries.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex gap-2">
                        {iconOptions.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setNewIcon(icon)}
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-all',
                              newIcon === icon
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-muted'
                            )}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., HR Documents, Q1 Financials"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="What kind of documents will this dataset contain?"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="rounded-xl resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} className="btn-gradient-primary rounded-xl">
                      Create Dataset
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-10"
              />
            </div>

            {/* Datasets Grid or Empty State */}
            {filteredDatasets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white/10 p-8 text-center shadow-xl"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold">No Datasets Created</h3>
                <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
                  Create a dataset to group your documents and enable focused, context-aware queries.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="btn-gradient-primary mt-6 rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Dataset
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredDatasets.map((dataset, index) => (
                    <motion.div
                      key={dataset.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card group relative overflow-hidden rounded-2xl border border-white/10 p-5 shadow-xl transition-all hover:shadow-2xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                            {dataset.icon}
                          </div>
                          <div>
                            <h3 className="font-display font-semibold">{dataset.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {dataset.documentIds.length} document{dataset.documentIds.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteTarget(dataset.id)}
                          className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {dataset.description && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {dataset.description}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDataset(dataset.id)}
                        className="mt-4 w-full rounded-xl gap-2"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Manage Documents
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Manage Documents Dialog */}
            <Dialog open={!!selectedDataset} onOpenChange={(open) => !open && setSelectedDataset(null)}>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-xl">{selectedDs?.icon}</span>
                    {selectedDs?.name}
                  </DialogTitle>
                  <DialogDescription>
                    Select documents to include in this dataset.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] space-y-2 overflow-auto py-4">
                  {availableDocs.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2" />
                      <p>No documents available. Upload files in the Knowledge Base first.</p>
                    </div>
                  ) : (
                    availableDocs.map((doc) => {
                      const isInDataset = selectedDs?.documentIds.includes(doc.id) || false;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => handleToggleDocument(selectedDataset!, doc.id, isInDataset)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                            isInDataset
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:bg-muted'
                          )}
                        >
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 truncate">{doc.name}</span>
                          <span className={cn(
                            'text-xs font-medium',
                            isInDataset ? 'text-primary' : 'text-muted-foreground'
                          )}>
                            {isInDataset ? 'Included' : 'Add'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={() => setSelectedDataset(null)} className="rounded-xl">
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dataset?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This will delete the embeddings permanently. The original documents will remain in your Knowledge Base.
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
