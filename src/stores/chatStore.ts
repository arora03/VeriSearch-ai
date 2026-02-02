import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, Dataset, Document } from '@/types/chat';

interface ChatStore {
  chats: Chat[];
  activeChat: string | null;
  datasets: Dataset[];
  activeDataset: string | null;
  documents: Document[];
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Chat actions
  createChat: () => string;
  deleteChat: (id: string) => void;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  
  // Dataset actions
  setActiveDataset: (id: string | null) => void;
  addDataset: (dataset: Dataset) => void;
  deleteDataset: (id: string) => void;
  addDocumentToDataset: (datasetId: string, documentId: string) => void;
  removeDocumentFromDataset: (datasetId: string, documentId: string) => void;
  
  // Document actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  
  // UI actions
  toggleSidebar: () => void;
  toggleTheme: () => void;
  
  // Stats
  getStats: () => { documentsIndexed: number; totalChats: number; storageUsed: number; datasetsCount: number };
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,
      datasets: [],
      activeDataset: null,
      documents: [],
      sidebarCollapsed: false,
      theme: 'light',

      createChat: () => {
        const newChat: Chat = {
          id: crypto.randomUUID(),
          title: 'New Conversation',
          messages: [],
          datasetId: get().activeDataset,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChat: newChat.id,
        }));
        return newChat.id;
      },

      deleteChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          activeChat: state.activeChat === id ? null : state.activeChat,
        }));
      },

      setActiveChat: (id) => {
        set({ activeChat: id });
      },

      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updatedAt: new Date(),
                  title: chat.messages.length === 0 ? message.content.slice(0, 40) + '...' : chat.title,
                }
              : chat
          ),
        }));
      },

      updateMessage: (chatId, messageId, updates) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                }
              : chat
          ),
        }));
      },

      setActiveDataset: (id) => {
        set({ activeDataset: id });
      },

      addDataset: (dataset) => {
        set((state) => ({
          datasets: [...state.datasets, dataset],
        }));
      },

      deleteDataset: (id) => {
        set((state) => ({
          datasets: state.datasets.filter((ds) => ds.id !== id),
          activeDataset: state.activeDataset === id ? null : state.activeDataset,
        }));
      },

      addDocumentToDataset: (datasetId, documentId) => {
        set((state) => ({
          datasets: state.datasets.map((ds) =>
            ds.id === datasetId
              ? { ...ds, documentIds: [...ds.documentIds, documentId] }
              : ds
          ),
        }));
      },

      removeDocumentFromDataset: (datasetId, documentId) => {
        set((state) => ({
          datasets: state.datasets.map((ds) =>
            ds.id === datasetId
              ? { ...ds, documentIds: ds.documentIds.filter((id) => id !== documentId) }
              : ds
          ),
        }));
      },

      addDocument: (document) => {
        set((state) => ({
          documents: [...state.documents, document],
        }));
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
        }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          datasets: state.datasets.map((ds) => ({
            ...ds,
            documentIds: ds.documentIds.filter((docId) => docId !== id),
          })),
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        set({ theme: newTheme });
      },

      getStats: () => {
        const state = get();
        return {
          documentsIndexed: state.documents.filter((d) => d.status === 'ready').length,
          totalChats: state.chats.length,
          storageUsed: state.documents.reduce((acc, doc) => acc + doc.size, 0),
          datasetsCount: state.datasets.length,
        };
      },
    }),
    {
      name: 'verisearch-storage',
      partialize: (state) => ({
        chats: state.chats,
        activeChat: state.activeChat,
        datasets: state.datasets,
        activeDataset: state.activeDataset,
        documents: state.documents,
        theme: state.theme,
      }),
    }
  )
);
