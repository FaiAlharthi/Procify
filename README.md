# Procify

A procurement management system that helps organizations create and manage RFPs (Requests for Proposals), collect vendor proposals, and evaluate them using AI scoring.

---

## Project Summary

Procify streamlines the procurement workflow between employees and vendors. Employees can create RFPs, invite vendors, and receive AI-powered proposal evaluations. Vendors can view open RFPs, submit proposals, and track their status. An AI chat assistant powered by Gemini helps users navigate procurement questions using a built-in document knowledge base.

---

## Technologies

This project is being developed with the following technologies:

- Backend: Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Frontend: React, Vite, JavaScript/JSX
- AI features: Gemini API and Ollama with the `qwen2.5:7b` model
- Database: SQLite for local development
- Version control: Git and GitHub

---

## Requirements

### Backend
- Python 3.10+
- [Ollama](https://ollama.com/) running locally with the `qwen2.5:7b` model (for proposal AI scoring)
- A Gemini API key (for the AI chat assistant)

### Frontend
- Node.js 18+
- npm

---

## Installation

### 1. Clone the repository
```bash
git clone <repo-url>
cd Procify
```

### 2. Backend setup
```bash
cd Backend/app
pip install -r requirements.txt
```

### 3. Frontend setup
```bash
cd Frontend
npm install
```

---

## Run the Project

### Start the Backend
```bash
cd Backend/app
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### Start the Frontend
```bash
cd Frontend
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## API Keys & Environment Variables

Create a `.env` file inside `Backend/` with the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**Ollama** must also be running locally on port `11434` with the `qwen2.5:7b` model pulled:
```bash
ollama pull qwen2.5:7b
ollama serve
```

---

## Limitations & Known Issues

- The SQLite database (`procify.db`) is seeded automatically on first run with sample employees, vendors, RFPs, and proposals.
- Ollama must be running locally for AI proposal scoring to work; the chat assistant uses Gemini separately.
- The app is configured for local development only — CORS is restricted to `localhost:5173` and `localhost:3000`.
- Default password for all seeded users (employees and vendors) is `1234`.


** This project represents the core concept and initial implementation. It is designed as a foundation that can be further enhanced with better AI models, more advanced technologies, additional features, and future improvements.
