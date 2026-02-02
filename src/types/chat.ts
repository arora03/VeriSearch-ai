export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  hasChart?: boolean;
  chartData?: ChartDataPoint[];
  isStreaming?: boolean;
}

export interface Citation {
  id: string;
  fileName: string;
  pageNumber: number;
  excerpt: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  datasetId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  documentIds: string[];
  icon: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'txt' | 'docx';
  status: 'uploading' | 'indexing' | 'ready' | 'error';
  progress?: number;
  uploadedAt: Date;
  size: number;
}

export interface AppStats {
  documentsIndexed: number;
  totalChats: number;
  storageUsed: number;
  datasetsCount: number;
}
