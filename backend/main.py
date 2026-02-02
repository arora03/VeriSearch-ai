"""
VeriSearch - Production RAG System
Advanced Retrieval-Augmented Generation with Hybrid Search & Re-Ranking

Architecture:
- Ingestion: LangChain Loaders (PDF, Excel, CSV, PowerPoint)
- Chunking: RecursiveCharacterTextSplitter
- Embeddings: HuggingFace (Local - No Rate Limits)
- Vector DB: FAISS (Facebook AI Similarity Search)
- Re-Ranking: FlashRank (Cross-Encoder for Accuracy)
- LLM: Google Gemini 1.5 Flash
- Streaming: Server-Sent Events (SSE)
"""

import os
import io
import uuid
import logging
import asyncio
from datetime import datetime
from typing import List, Optional, AsyncGenerator
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

# LangChain imports
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# File parsing
import pandas as pd
from pypdf import PdfReader

# Re-ranking
try:
    from flashrank import Ranker, RerankRequest
    FLASHRANK_AVAILABLE = True
except ImportError:
    FLASHRANK_AVAILABLE = False
    logging.warning("FlashRank not available - will use basic ranking")

# Google Gemini
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="VeriSearch RAG API",
    version="2.0.0",
    description="Enterprise RAG System with Hybrid Search & Re-Ranking"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    logger.info(f"📥 {request.method} {request.url.path}")
    response = await call_next(request)
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(f"📤 {request.method} {request.url.path} - {response.status_code} - {duration:.2f}s")
    return response

# Initialize components
logger.info("🚀 Initializing RAG components...")

# 1. Text Splitter (Chunking)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

# 2. Local Embeddings (HuggingFace - No Rate Limits!)
logger.info("📦 Loading HuggingFace embeddings model...")
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
logger.info("✅ Embeddings model loaded")

# 3. FlashRank Re-Ranker (Accuracy Boost)
if FLASHRANK_AVAILABLE:
    logger.info("🎯 Initializing FlashRank re-ranker...")
    ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2", cache_dir="./.cache")
    logger.info("✅ FlashRank initialized")
else:
    ranker = None

# 4. FAISS Vector Store (Global - with persistence)
vector_store: Optional[FAISS] = None

def save_vector_store():
    """Save FAISS index to disk"""
    global vector_store
    if vector_store:
        try:
            vector_store.save_local("faiss_index")
            logger.info("💾 FAISS index saved to disk")
        except Exception as e:
            logger.error(f"❌ Failed to save FAISS index: {str(e)}")

def load_vector_store():
    """Load FAISS index from disk"""
    global vector_store
    try:
        if os.path.exists("faiss_index"):
            logger.info("📂 Loading existing FAISS index...")
            vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
            logger.info(f"✅ Loaded {vector_store.index.ntotal} documents from disk")
        else:
            logger.info("🆕 No existing index found - starting fresh")
    except Exception as e:
        logger.error(f"❌ Failed to load FAISS index: {str(e)}")

# Load on startup
load_vector_store()

# 5. Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✅ Gemini API configured")
else:
    logger.warning("⚠️ No GEMINI_API_KEY found - will return mock responses")

# Pydantic Models
class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    chunks_processed: int
    status: str
    message: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    datasetId: Optional[str] = None

class Citation(BaseModel):
    id: str
    fileName: str
    pageNumber: int
    excerpt: str

# Helper Functions

def parse_pdf_file(file_content: bytes, filename: str) -> List[Document]:
    """Parse PDF and extract text with page numbers"""
    documents = []
    try:
        pdf_reader = PdfReader(io.BytesIO(file_content))
        for page_num, page in enumerate(pdf_reader.pages, start=1):
            text = page.extract_text()
            if text.strip():
                documents.append(Document(
                    page_content=text,
                    metadata={
                        "filename": filename,
                        "page": page_num,
                        "type": "pdf",
                        "source": f"{filename} - Page {page_num}"
                    }
                ))
        logger.info(f"📄 Parsed PDF: {len(documents)} pages")
    except Exception as e:
        logger.error(f"❌ PDF parsing failed: {str(e)}")
        raise
    return documents

def parse_excel_file(file_content: bytes, filename: str) -> List[Document]:
    """Parse Excel/CSV and convert rows to searchable text"""
    documents = []
    try:
        # Try Excel first
        excel_file = pd.ExcelFile(io.BytesIO(file_content))
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # Convert each row to a document
            for idx, row in df.iterrows():
                row_text = f"Sheet: {sheet_name}, Row {idx + 2}\n"  # +2 for header and 0-indexing
                row_text += "\n".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                
                documents.append(Document(
                    page_content=row_text,
                    metadata={
                        "filename": filename,
                        "sheet": sheet_name,
                        "row": idx + 2,
                        "type": "excel",
                        "source": f"{filename} - {sheet_name} Row {idx + 2}"
                    }
                ))
        logger.info(f"📊 Parsed Excel: {len(documents)} rows from {len(excel_file.sheet_names)} sheets")
    except Exception as e:
        # If Excel fails, try CSV
        try:
            df = pd.read_csv(io.BytesIO(file_content))
            for idx, row in df.iterrows():
                row_text = f"Row {idx + 2}\n"
                row_text += "\n".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                
                documents.append(Document(
                    page_content=row_text,
                    metadata={
                        "filename": filename,
                        "row": idx + 2,
                        "type": "csv",
                        "source": f"{filename} - Row {idx + 2}"
                    }
                ))
            logger.info(f"📊 Parsed CSV: {len(documents)} rows")
        except Exception as csv_error:
            logger.error(f"❌ Excel/CSV parsing failed: {str(csv_error)}")
            raise
    
    return documents

def parse_powerpoint_file(file_path: str, filename: str) -> List[Document]:
    """Parse PowerPoint and extract slide content"""
    documents = []
    try:
        loader = UnstructuredPowerPointLoader(file_path)
        raw_docs = loader.load()
        
        for idx, doc in enumerate(raw_docs, start=1):
            documents.append(Document(
                page_content=doc.page_content,
                metadata={
                    "filename": filename,
                    "slide": idx,
                    "type": "pptx",
                    "source": f"{filename} - Slide {idx}"
                }
            ))
        logger.info(f"📽️ Parsed PowerPoint: {len(documents)} slides")
    except Exception as e:
        logger.error(f"❌ PowerPoint parsing failed: {str(e)}")
        raise
    
    return documents


def safe_get_chunk_text(chunk) -> str:
    """Safely get text from Gemini response chunk, handling safety blocks"""
    try:
        return chunk.text if hasattr(chunk, 'text') else ""
    except (ValueError, AttributeError):
        # Safety filter blocked or no text in chunk
        return ""

async def generate_streaming_response(query: str, context: str, history: List[ChatMessage]) -> AsyncGenerator[str, None]:
    """Generate streaming response using Gemini"""
    
    if not GEMINI_API_KEY:
        # Mock streaming response for demo
        mock_response = "Based on the retrieved documents, I can provide information about your query. However, no API key is configured, so this is a mock response for demonstration purposes."
        for char in mock_response:
            yield f"data: {json.dumps({'type': 'content', 'data': char})}\n\n"
            await asyncio.sleep(0.01)
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return
    
    try:
        # Build conversation history
        history_text = ""
        if history:
            for msg in history[-5:]:  # Last 5 messages for context
                history_text += f"{msg.role.upper()}: {msg.content}\n\n"
        
        # Build prompt
        prompt = f"""You are VeriSearch, an intelligent assistant that answers questions based on company documents.

CONTEXT FROM DOCUMENTS:
{context}

{f"CONVERSATION HISTORY:\n{history_text}" if history_text else ""}

USER QUESTION: {query}

Instructions:
1. Answer based ONLY on the provided context
2. If the context doesn't contain the answer, say so clearly
3. Cite specific documents or pages when possible
4. Be concise but comprehensive
5. Use formatting (bullet points, bold) for clarity

ANSWER:"""


        # Initialize Gemini model (User confirmed 2.5)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Stream response
        logger.info("🌟 Streaming from Gemini...")
        logger.info(f"📝 PROMPT GENERATED:\n{prompt}\n-------------------")
        response = model.generate_content(prompt, stream=True)
        
        has_content = False
        for chunk in response:
            try:
                print(f"DEBUG CHUNK: {chunk.text[:20] if hasattr(chunk, 'text') else 'No Text'}")
            except:
                print("DEBUG CHUNK: Error accessing text")
            
            text = safe_get_chunk_text(chunk)
            if text:
                has_content = True
                yield f"data: {json.dumps({'type': 'content', 'data': text})}\n\n"
        
        if not has_content:
            msg = "Response blocked. Try different question."
            yield f"data: {json.dumps({'type': 'content', 'data': msg})}\n\n"
         
        yield f"data: {json.dumps({'type': 'done'})}\\n\\n"
        logger.info("✅ Streaming completed")
        
    except Exception as e:
        logger.error(f"❌ Streaming error: {str(e)}")
        error_msg = f"Error generating response: {str(e)}"
        yield f"data: {json.dumps({'type': 'error', 'data': error_msg})}\n\n"

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global vector_store
    return {
        "status": "healthy",
        "service": "VeriSearch RAG API",
        "version": "2.0.0",
        "components": {
            "embeddings": "HuggingFace (all-MiniLM-L6-v2)",
            "vector_db": "FAISS",
            "reranker": "FlashRank" if FLASHRANK_AVAILABLE else "Basic",
            "llm": "Gemini 1.5 Flash",
            "gemini_configured": GEMINI_API_KEY is not None
        },
        "documents_indexed": vector_store.index.ntotal if vector_store else 0
    }

@app.post("/ingest", response_model=IngestResponse)
async def ingest_document(file: UploadFile = File(...)):
    """
    Ingest a document into the RAG system
    
    Supports: PDF, Excel (.xlsx, .xls), CSV, PowerPoint (.pptx)
    
    Process:
    1. Parse document based on file type
    2. Split into chunks (1000 chars, 200 overlap)
    3. Generate embeddings (HuggingFace)
    4. Store in FAISS vector database
    """
    global vector_store
    
    try:
        logger.info(f"📄 Starting ingestion: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        filename = file.filename
        file_size = len(file_content)
        logger.info(f"📊 File size: {file_size / 1024:.2f} KB")
        
        # Parse based on file type
        documents = []
        
        if filename.lower().endswith('.pdf'):
            documents = parse_pdf_file(file_content, filename)
            
        elif filename.lower().endswith(('.xlsx', '.xls', '.csv')):
            documents = parse_excel_file(file_content, filename)
            
        elif filename.lower().endswith('.pptx'):
            # Save temporarily for UnstructuredPowerPointLoader
            temp_path = f"/tmp/{filename}"
            with open(temp_path, 'wb') as f:
                f.write(file_content)
            documents = parse_powerpoint_file(temp_path, filename)
            os.remove(temp_path)
            
        elif filename.lower().endswith('.txt'):
            text = file_content.decode('utf-8')
            documents = [Document(
                page_content=text,
                metadata={"filename": filename, "type": "txt", "source": filename}
            )]
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported: PDF, Excel, CSV, PowerPoint, TXT"
            )
        
        if not documents:
            raise HTTPException(status_code=400, detail="No content could be extracted from the file")
        
        logger.info(f"✅ Parsed {len(documents)} document sections")
        
        # Split into chunks
        all_chunks = []
        for doc in documents:
            chunks = text_splitter.split_documents([doc])
            all_chunks.extend(chunks)
        
        logger.info(f"✂️ Created {len(all_chunks)} chunks")
        
        # Generate unique doc ID
        doc_id = str(uuid.uuid4())
        
        # Add doc_id to metadata
        for chunk in all_chunks:
            chunk.metadata["doc_id"] = doc_id
        
        # Create or update FAISS vector store
        if vector_store is None:
            logger.info("🔨 Creating new FAISS index...")
            vector_store = FAISS.from_documents(all_chunks, embeddings)
        else:
            logger.info("➕ Adding to existing FAISS index...")
            vector_store.add_documents(all_chunks)
        
        total_docs = vector_store.index.ntotal
        logger.info(f"💾 Vector store now contains {total_docs} chunks")
        logger.info(f"✅ Successfully ingested {filename}")
        
        return IngestResponse(
            doc_id=doc_id,
            filename=filename,
            chunks_processed=len(all_chunks),
            status="success",
            message=f"Successfully processed {len(all_chunks)} chunks from {filename}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ingestion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
    finally:
        # Always save after modification
        save_vector_store()

@app.post("/chat")
async def chat_stream(request: ChatRequest):
    """
    RAG Chat with Hybrid Search & Streaming
    
    Process:
    1. Retrieve top 10 chunks from FAISS
    2. Re-rank with FlashRank to top 5
    3. Generate streaming response with Gemini
    """
    global vector_store
    
    try:
        query = request.message
        logger.info(f"💬 Chat query: '{query[:100]}...'")
        
        # Check if documents are indexed
        if vector_store is None or vector_store.index.ntotal == 0:
            logger.warning("⚠️ No documents indexed")
            
            async def no_docs_response():
                msg = "No documents have been indexed yet. Please upload documents first using the Knowledge Base section."
                yield f"data: {json.dumps({'type': 'content', 'data': msg})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
            return StreamingResponse(
                no_docs_response(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        
        # Step 1: FAISS Vector Search (Top 10)
        logger.info(f"🔍 Searching {vector_store.index.ntotal} chunks in FAISS...")
        retrieved_docs = vector_store.similarity_search(query, k=10)
        logger.info(f"📚 Retrieved {len(retrieved_docs)} chunks from FAISS")
        
        # Step 2: FlashRank Re-Ranking (Top 5)
        if FLASHRANK_AVAILABLE and ranker and len(retrieved_docs) > 0:
            logger.info("🎯 Re-ranking with FlashRank...")
            
            # Prepare passages for re-ranking
            passages = [{"text": doc.page_content} for doc in retrieved_docs]
            rerank_request = RerankRequest(query=query, passages=passages)
            reranked_results = ranker.rerank(rerank_request)
            
            # Get top 5 after re-ranking
            top_indices = [result['corpus_id'] for result in reranked_results[:5]]
            final_docs = [retrieved_docs[i] for i in top_indices]
            
            logger.info(f"✅ Re-ranked to top {len(final_docs)} chunks")
        else:
            # No re-ranking, just take top 5
            final_docs = retrieved_docs[:5]
        
        # Build context from top chunks
        context = "\n\n---\n\n".join([
            f"[Source: {doc.metadata.get('source', 'Unknown')}]\n{doc.page_content}"
            for doc in final_docs
        ])
        
        logger.info(f"📝 Context prepared ({len(context)} chars)")
        
        # Step 3: Stream response from Gemini
        return StreamingResponse(
            generate_streaming_response(query, context, request.history),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting VeriSearch RAG API...")
    logger.info("📍 Server: http://localhost:8000")
    logger.info("📖 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
