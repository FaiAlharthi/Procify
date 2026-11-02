<p align="center">
  <img src="Frontend/public/logo.png" alt="Procify" width="140">
</p>

# Procify

A procurement platform where employees write RFPs (Requests for Proposals), vendors upload PDF proposals, and AI scores each proposal against the RFP. Built as a team project at Saudi Digital Academy.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?logo=googlegemini&logoColor=white)

## What it does

- **Employees** create RFPs in five sections (objective, scope, technical criteria, commercials, delivery), export them as PDF, pick vendors, and compare proposals side by side.
- **Vendors** see the RFPs they were invited to and upload a PDF proposal.
- **AI proposal scoring:** a local LLM (Ollama, `qwen2.5:7b`) reads the RFP and the proposal and returns a score out of 100 with a short explanation for each section.
- **AI vendor suggestions:** Gemini compares the RFP with vendor descriptions and returns the best matches with reasons.
- **RFP writing assistant:** a chat that suggests improvements and can fill RFP fields. It searches a small procurement knowledge base (BM25 search I wrote from scratch over the files in `Backend/documents`).

## Tech stack

Python, FastAPI, SQLAlchemy, Alembic, JWT (bcrypt passwords), SQLite, React 19 + Vite, Google Gemini, Ollama.

## Run it locally

You need Python 3.10+, Node.js, and [Ollama](https://ollama.com/).

```bash
git clone https://github.com/FaiAlharthi/Procify.git
cd Procify
```

**Backend**

```bash
cd Backend
pip install -r app/requirements.txt
cp .env.example .env        # then add your GEMINI_API_KEY
ollama pull qwen2.5:7b      # used for proposal scoring and the chat assistant
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000 (interactive docs at `/docs`). On first start the database is created and filled with demo employees, vendors, RFPs, and proposals.

**Frontend**

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173.

**Demo logins** (password `1234` for all): employees `E0001`–`E0007`, vendors `V0001`–`V0011`. Choose the matching role on the login screen.

## API reference

Interactive docs are also available at `/docs` when the backend is running. Endpoints marked 🔒 need a `Authorization: Bearer <token>` header from `/auth/login`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Log in as `employee` or `vendor`. Returns a JWT (valid 8 hours). |

```json
// request
{ "user_id": "E0001", "password": "1234", "role": "employee" }
// response
{ "access_token": "...", "token_type": "bearer", "role": "employee", "user_id": "E0001", "name": "Bahy", "company_name": "Saudi Digital Academy", "company_id": "C0001" }
```

### RFPs

| Method | Endpoint | Who | Description |
|---|---|---|---|
| POST | `/rfps/` | 🔒 employee | Create an RFP (starts as `draft`). |
| GET | `/rfps/?vendor_id=V0001` | public | List RFPs, optionally only those a vendor was invited to. |
| PATCH | `/rfps/{rfp_id}` | 🔒 employee | Update RFP fields. |
| POST | `/rfps/{rfp_id}/send-to-vendors` | 🔒 employee | Invite vendors: `{ "vendor_ids": ["V0001", "V0002"] }`. |
| GET | `/rfps/{rfp_id}/pdf` | public | Download the RFP as a PDF. |
| PATCH | `/rfps/{rfp_id}/close` | 🔒 employee | Close the RFP, optionally with `winner_vendor_id`. |
| DELETE | `/rfps/{rfp_id}` | 🔒 employee | Delete an RFP (drafts only). |
| GET | `/rfps/{rfp_id}/suggested-vendors` | public | Top 5 vendors by AI match score, with reasons. |

### Proposals

| Method | Endpoint | Who | Description |
|---|---|---|---|
| POST | `/proposals/analyze/{rfp_id}` | 🔒 vendor | Upload a PDF (`multipart/form-data`, field `file`). The text is extracted, scored by AI, and saved. Uploading again replaces the earlier proposal. |
| GET | `/proposals/?rfp_id=R0001` | public | List proposals, optionally for one RFP. |
| GET | `/proposals/{proposal_id}/file` | public | Open the uploaded PDF. |

### Vendors, employees, chat

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vendors/` | List vendors. |
| GET | `/vendors/{vendor_id}` | Get one vendor. |
| GET | `/employees/{employee_id}` | Get one employee. |
| POST | `/chat/` | RFP writing assistant. Body: `{ "message": "...", "rfp_context": { "title": "...", "objective": "..." } }`. Returns `{ "response": "...", "updates": { "objective": "..." } }`. |

Errors use standard HTTP codes: `401` bad or missing token, `403` wrong role, `404` not found, `422` unreadable PDF, `502` AI service failed.

## Project structure

```
Backend/
  app/
    main.py            app setup, CORS, demo data
    auth.py            JWT and password hashing
    models.py          database tables
    routers/           auth, rfps, proposals, vendors, employees, chat, vendor_suggestions
    ai_service.py      proposal scoring (Ollama)
    rag_service.py     BM25 search over documents/
  documents/           procurement knowledge base (markdown)
  alembic/             migrations
Frontend/              React + Vite app
```

## What I would improve next

- Move the JWT secret to an environment variable and protect the read endpoints that are currently public.
- Sanitize uploaded file names and store each upload under a unique name.
- Show the vendor's score only to employees.
- Add automated tests for the auth and scoring flow.
- Deploy with Docker and PostgreSQL.

## Team

Built together at Saudi Digital Academy. We all worked across the full stack, so the work was shared rather than split by role.

<table>
  <tr>
    <td align="center"><a href="https://github.com/FaiAlharthi"><b>Fai</b></a><br>FaiAlharthi</td>
    <td align="center"><a href="https://github.com/shouqaalaboudi"><b>Shouq</b></a><br>shouqaalaboudi</td>
    <td align="center"><a href="https://github.com/Ranasaubid"><b>Rana</b></a><br>Ranasaubid</td>
    <td align="center"><a href="https://github.com/AbrarAlanzi"><b>Abrar</b></a><br>AbrarAlanzi</td>
  </tr>
</table>
