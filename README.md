# VeriSearch AI 🧠✨

![VeriSearch Banner](/public/og-image.png)

**VeriSearch** is an enterprise-grade RAG (Retrieval-Augmented Generation) platform designed to provide accurate, verifiable answers from your internal knowledge base.

It combines the power of **Google Gemini 1.5 Flash** with **FAISS Vector Search** and **FlashRank Re-ranking** to deliver hallucination-free responses with precise citations.

## 🚀 Features

- **📚 Intelligent Ingestion**: Drag-and-drop PDF, DOCX, and TXT files. System automatically chunks and indexes content.
- **💾 Persistent Vector Store**: Knowledge base survives restarts. Built on FAISS.
- **🔍 Hybrid Search**: Semantic retrieval + Keyword search + Re-ranking for maximum accuracy.
- **💬 Streaming Chat**: Real-time AI responses with type-safe streaming.
- **📎 Smart Citations**: Every answer links back to the exact source document and page number.
- **🎨 Aesthetic UI**: "Soothing Enterprise" design system with pastel gradients and glassmorphism.
- **📊 Analytics Dashboard**: Track usage, document counts, and system health.

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** + **Shadcn/UI**
- **Framer Motion** (Animations)
- **Zustand** (State Management)
- **Lucide React** (Icons)

### Backend
- **FastAPI** (Python)
- **LangChain**
- **FAISS** (Vector Database)
- **Google Gemini API** (LLM)
- **HuggingFace Embeddings** (`all-MiniLM-L6-v2`)

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arora03/verisearch-ai.git
   cd verisearch-ai
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv backend_venv
   .\backend_venv\Scripts\activate
   pip install -r requirements.txt
   ```
   *Create a `.env` file in `backend/` with:*
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Setup Frontend**
   ```bash
   # In the root directory
   npm install
   ```

4. **Run Application**
   ```bash
   # Terminal 1 (Backend)
   cd backend
   .\backend_venv\Scripts\python main.py

   # Terminal 2 (Frontend)
   npm run dev
   ```

## 📸 Screenshots

*(Add your screenshots here)*

## 📄 License

MIT License. Built with ❤️ by VeriSearch Team.
