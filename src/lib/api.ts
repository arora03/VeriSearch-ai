/**
 * VeriSearch Backend API Client
 * Connects to FastAPI RAG backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface IngestResponse {
    doc_id: string;
    filename: string;
    chunks_processed: number;
    status: string;
    message: string;
}

/**
 * Upload and ingest a document into the RAG system
 */
export async function ingestDocument(file: File): Promise<IngestResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Ingestion failed' }));
        throw new Error(error.detail || 'Failed to ingest document');
    }

    return response.json();
}

/**
 * Send a chat message and receive streaming response
 */
export async function sendChatMessage(
    message: string,
    history: ChatMessage[] = [],
    datasetId?: string | null,
    onChunk?: (chunk: string) => void,
    onDone?: () => void,
    onError?: (error: string) => void
): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                history,
                datasetId,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Chat request failed' }));
            throw new Error(error.detail || 'Failed to send message');
        }

        // Handle SSE streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;

                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    try {
                        const parsed = JSON.parse(data);

                        if (parsed.type === 'content' && onChunk) {
                            onChunk(parsed.data);
                        } else if (parsed.type === 'done' && onDone) {
                            onDone();
                        } else if (parsed.type === 'error' && onError) {
                            onError(parsed.data);
                        }
                    } catch (e) {
                        // Normalize error handling
                        console.debug("Skipping partial/invalid JSON:", data);
                    }
                }
            }
        }
    } catch (error) {
        if (onError) {
            onError(error instanceof Error ? error.message : 'Unknown error occurred');
        } else {
            throw error;
        }
    }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    components: Record<string, any>;
    documents_indexed: number;
}> {
    const response = await fetch(`${API_URL}/health`);

    if (!response.ok) {
        throw new Error('Health check failed');
    }

    return response.json();
}
