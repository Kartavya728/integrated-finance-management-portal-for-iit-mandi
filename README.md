# 🏛️ Legal Document Analyzer with LangChain, LangGraph & Supabase

An AI-powered legal document analyzer that:
- Extracts text from **PDF, DOCX, XLS** files
- Analyzes amounts, dates, and purposes
- Compares real-time pricing online
- Uses **RAG** on **Indian Court Documentation** for legal references
- Summarizes findings in simple, structured outputs

---

## 🚀 Features
- **Next.js 15** frontend
- **FastAPI + LangChain + LangGraph** backend
- **Supabase pgvector** for semantic search & RAG
- **Google Cloud Vision API** for text extraction
- **Vercel deployment** for frontend + backend

---

## 🛠️ Tech Stack
| Component      | Technology |
|---------------|-----------|
Frontend        | Next.js 15 + TailwindCSS  
Backend         | FastAPI + LangChain + LangGraph  
Database        | Supabase + pgvector  
AI Models       | OpenAI GPT-4 / Gemini Pro / LLaMA3  
Storage         | Supabase Buckets  
Deployment      | Vercel  

---

## 📂 Folder Structure
See [Project Structure](./) above.

---

## 🔧 Setup
```bash
# Clone repo
git clone https://github.com/your-username/legal-doc-analyzer.git
cd legal-doc-analyzer

# Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# Run backend
cd backend
uvicorn main:app --reload

# Run frontend
cd frontend
npm run dev
