# MASTER PROMPT -- TalentMind AI Recruitment Platform

> Pass this entire document to your frontend generation tool (Anti Gravity) to generate a modern, dynamic, professional HR dashboard frontend.

---

## PROJECT OVERVIEW

**TalentMind** is an AI-powered recruitment and candidate management platform. It consists of:

- **Node.js Backend** (Express, port 8080) -- REST API for HR auth, candidate CRUD, job management, PDF uploads, email/HRMS sync pipelines
- **Python AI Chat-Bot** (Flask, port 5001) -- Gemini LLM + Pinecone vector search for semantic candidate search, AI chat, job-description matching/reranking
- **Python Data-Extraction** (FastAPI, port 8000) -- Extracts structured candidate data from resume PDFs using Gemini AI
- **Python Email Scraper** (Flask, port 5003) -- Scans Gmail for job-related emails, uploads PDF attachments to Cloudinary
- **MongoDB Atlas** -- Primary database (collection: `candidates` for candidates, `hr` for HR users, `jobs` for jobs)
- **Cloudinary** -- PDF/file hosting
- **Pinecone** -- Vector database for semantic search

The frontend should be a **modern, dynamic, professional-looking HR dashboard** built with **React** (or Next.js). It must connect to the Backend at `http://localhost:8080` and the AI Chat-Bot at `http://localhost:5001`.

---

## FRONTEND ROUTES (Pages to Build)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | **AuthPage** | Login / Signup toggle for HR users |
| `/dashboard` | **AllCandidates** | Global talent pool with AI-powered search bar, sync buttons, candidate cards |
| `/jobs` | **JobBoard** | View all active job roles, create new jobs, click to open pipeline |
| `/portal` | **JobPortal** | Per-job candidate pipeline with stage tabs, AI Smart Match, drag-n-drop stage changes |
| `/upload` | **UploadPage** | Drag-and-drop PDF resume upload to Cloudinary |
| `*` | Redirect to `/` | Catch-all |

### Navigation Bar (present on all pages except AuthPage)
Links: "All Candidates" (`/dashboard`), "Job Board" (`/jobs`), "Upload Resume" (`/upload`), "Logout" (`/`)

---

## COMPLETE API REFERENCE

### Base URLs
- **Backend API**: `http://localhost:8080`
- **AI Chat-Bot API**: `http://localhost:5001`

---

### 1. AUTHENTICATION

#### POST `/api/v1/users/register`
Register a new HR user.

**Request Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required)",
  "password": "string (required, min 6 chars)",
  "appPassword": "string (required, min 6 chars)"
}
```

**Success Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "MongoDB ObjectId",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "message": "HR registered successfully",
  "success": true
}
```

**Error Responses:**
- `400` -- Missing required fields
- `409` -- Email already exists

---

#### POST `/api/v1/users/login`
Login an HR user. Sets `accessToken` cookie.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "MongoDB ObjectId",
    "email": "john@example.com",
    "accessToken": "JWT string"
  },
  "message": "Login successful",
  "success": true
}
```

**Notes:**
- Use `credentials: "include"` in fetch/axios to send cookies
- Token is also set as httpOnly cookie named `accessToken`

**Error Responses:**
- `400` -- Missing email or password
- `401` -- Invalid credentials

---

### 2. CANDIDATES

#### GET `/api/v1/users/resumes`
Fetch all candidates. Optionally filter by role.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | No | Filter by applied_role (case-insensitive) |

**Example:** `GET /api/v1/users/resumes?role=software%20development`

**Success Response (200):**
```json
[
  {
    "_id": "MongoDB ObjectId",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+91-9876543210",
    "applied_role": "software development",
    "applicationStage": "Applied",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "totalExperienceYears": 3.5,
    "skills": ["React", "Node.js", "Python", "MongoDB"],
    "experience": [
      {
        "company": "TechCorp",
        "role": "Software Engineer",
        "startDate": "2021-01-01T00:00:00.000Z",
        "endDate": "2024-01-01T00:00:00.000Z",
        "techstack": ["React", "Node.js"],
        "years_worked": "3 years",
        "description": "Built full-stack web applications"
      }
    ],
    "education": [
      {
        "institution": "IIT Bombay",
        "degree": "B.Tech Computer Science",
        "from": 2017,
        "to": 2021,
        "score": "8.5 CGPA"
      }
    ],
    "sourcePlatforms": ["Gmail_Auto_Sync"],
    "originalResumeUrls": ["https://res.cloudinary.com/...resume.pdf"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### PUT `/api/v1/users/stage/:id`
Update a candidate's pipeline stage.

**URL Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | MongoDB ObjectId of the candidate |

**Request Body:**
```json
{
  "stage": "Round 1"
}
```

**Valid stage values:** `"Applied"`, `"Round 1"`, `"Round 2"`, `"Hired"`, `"Rejected"`

**Success Response (200):** Returns the updated candidate object.

---

#### POST `/api/v1/users/batch`
Fetch multiple candidates by an array of IDs. Used after AI matching to get full profiles.

**Request Body:**
```json
{
  "ids": ["ObjectId_1", "ObjectId_2", "ObjectId_3"]
}
```

**Success Response (200):** Array of full candidate objects.

**Error Response:**
- `400` -- Missing or invalid `ids` array

---

#### GET `/api/v1/users/ai-match-filter`
Get candidates filtered by role AND applicationStage="Applied". Used as input for AI Smart Match.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | Job role to filter by |

**Example:** `GET /api/v1/users/ai-match-filter?role=software%20development`

**Success Response (200):** Array of candidate objects (only "Applied" stage).

**Error Response:**
- `400` -- Missing `role` parameter

---

#### POST `/api/v1/users/upload-manual`
Upload a resume PDF to Cloudinary.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdfFile` | File | Yes | The PDF file (max 5MB) |
| `appliedRole` | string | No | Job role the candidate is applying for |

**Success Response (200):**
```json
{
  "success": true,
  "pdfUrl": "https://res.cloudinary.com/di92sus72/image/upload/v.../resumes/file.pdf",
  "message": "PDF uploaded to Cloudinary."
}
```

**Error Responses:**
- `400` -- No file or file not found
- `503` -- Cloudinary not configured
- `500` -- Upload failed

---

### 3. SYNC PIPELINES

#### GET `/api/candidates/sync`
Trigger Gmail email sync pipeline. Checks Gmail for unread job-related emails, extracts resume data via AI, saves candidate to DB, syncs to Pinecone.

**Success Response (200):**
```json
{
  "success": true,
  "candidate": { /* full candidate object */ }
}
```

**Or if no new emails:**
```json
{
  "success": true,
  "message": "No new emails."
}
```

---

#### GET `/api/candidates/sync-hrms`
Trigger HRMS sync pipeline. Fetches candidate data from external HRMS system, extracts resume via AI, saves to DB, syncs to Pinecone.

**Success Response (200):**
```json
{
  "success": true,
  "candidate": { /* full candidate object */ }
}
```

**Or if no new candidates:**
```json
{
  "success": true,
  "message": "No new candidates."
}
```

---

### 4. JOBS

#### GET `/api/v1/jobs`
Fetch all jobs.

**Success Response (200):**
```json
[
  {
    "_id": "MongoDB ObjectId",
    "title": "software development",
    "status": "Active",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-10T08:00:00.000Z"
  }
]
```

**Note:** `title` is always stored in lowercase.

---

#### POST `/api/v1/jobs`
Create a new job.

**Request Body:**
```json
{
  "title": "Software Development"
}
```

**Success Response (201):** Returns the created job object.

---

#### PUT `/api/v1/jobs/:id/end`
Mark a job as completed/archived.

**Success Response (200):** Returns updated job object with `status: "Completed"`.

---

#### DELETE `/api/v1/jobs/:id`
Delete a job AND permanently remove all candidates who applied for that role.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Job and all associated candidates were permanently deleted."
}
```

---

### 5. HEALTH CHECK

#### GET `/health`
Backend health check.

**Response (200):**
```json
{
  "status": "OK",
  "message": "Auth server ready"
}
```

---

## AI CHAT-BOT API (Port 5001)

### 1. AI CHAT

#### POST `/api/chat`
Main AI chat endpoint. Send natural language queries about candidates. The AI uses Pinecone vector search + Gemini LLM to answer.

**Request Body:**
```json
{
  "session_id": "s_abc123",
  "message": "Find top React developers in Mumbai with 3+ years experience"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "session_id": "s_abc123",
  "response": "Here are the top React developers...\n\n1. Jane Smith - 3.5 years...",
  "metadata": {
    "searched": true,
    "count": 3,
    "query": "React developers Mumbai 3+ years"
  }
}
```

**Notes:**
- `response` can be a string (text answer), an object with candidate data, or an array
- Generate a random `session_id` per user session for conversation continuity
- The AI understands queries like: "Compare skills of X and Y", "Who has the most Python experience?", "List all candidates from Ahmedabad"

**Error Responses:**
- `400` -- Missing session_id or message

---

### 2. SESSION MANAGEMENT

#### GET `/api/sessions/:session_id/history`
Get full conversation history for a chat session.

**Response (200):**
```json
{
  "session_id": "s_abc123",
  "history": [
    { "role": "user", "content": "Find React devs" },
    { "role": "assistant", "content": "Here are..." }
  ],
  "count": 2
}
```

---

#### DELETE `/api/sessions/:session_id/clear`
Clear conversation history for a session.

**Response (200):**
```json
{
  "success": true,
  "message": "Session s_abc123 cleared"
}
```

---

#### GET `/api/sessions`
List all active session IDs.

**Response (200):**
```json
{
  "sessions": ["s_abc123", "s_def456"],
  "count": 2
}
```

---

### 3. AI JOB-DESCRIPTION MATCHING

#### POST `/api/match/job-description`
Match a job description against candidate IDs. Uses Gemini LLM to infer required skills and rank candidates.

**Request Body:**
```json
{
  "job_description": "Need software development candidate with Python + Node.js skills",
  "candidate_ids": ["ObjectId_1", "ObjectId_2", "ObjectId_3"],
  "top_k": 3
}
```

**Success Response (200):**
```json
{
  "success": true,
  "job_description": "Need software development candidate...",
  "top_k": 3,
  "strategy": "llm_rerank",
  "required_skills": ["Python", "Node.js", "REST APIs"],
  "mongo_ids": ["ObjectId_2", "ObjectId_1"],
  "reasons": [
    {
      "mongo_id": "ObjectId_2",
      "score": 92,
      "reason": "Strong Python + Node.js experience with REST API projects"
    },
    {
      "mongo_id": "ObjectId_1",
      "score": 78,
      "reason": "Good Python skills, limited Node.js exposure"
    }
  ],
  "candidates": [ /* full candidate objects */ ],
  "considered_candidates": 5,
  "input_candidate_ids": ["ObjectId_1", "ObjectId_2", "ObjectId_3"]
}
```

**Notes:**
- `strategy` is either `"llm_rerank"` (AI ranked) or `"skills_fallback"` (keyword matching fallback)
- `reasons` contains per-candidate scores (0-100) and explanations
- Only candidates with `applicationStage: "Applied"` are considered

---

#### POST `/api/match/job-description/applicants`
Same as above but pass full candidate objects instead of IDs.

**Request Body:**
```json
{
  "job_description": "Need Python backend engineer",
  "job_title": "software development",
  "top_k": 3,
  "applicants": [ /* array of full candidate objects */ ]
}
```

**Success Response (200):** Same structure as `/api/match/job-description`.

---

### 4. VECTOR SEARCH

#### POST `/api/search`
Raw semantic search against Pinecone (no AI chat layer).

**Request Body:**
```json
{
  "query": "Python developers in Ahmedabad",
  "top_k": 5
}
```

**Success Response (200):**
```json
{
  "success": true,
  "candidates": [ /* matched candidate objects */ ],
  "total": 3
}
```

---

### 5. AUTOMATED ACTIONS

#### POST `/api/actions/automated`
Execute recruiter actions via natural language.

**Request Body:**
```json
{
  "command": "Move 507f1f77bcf86cd799439011 to round1 and hire 507f1f77bcf86cd799439012"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "actions_executed": [
    { "action": "move_stage", "candidate_id": "507f...", "new_stage": "Round 1", "status": "done" },
    { "action": "hire", "candidate_id": "507f...", "new_stage": "Hired", "status": "done" }
  ]
}
```

---

### 6. VECTOR DB MANAGEMENT

#### POST `/api/vector/upsert`
Upsert a single candidate into Pinecone.

**Request Body:** Full candidate JSON object (must have `_id` or `id` field).

**Response:** `{ "success": true, "mongo_id": "..." }`

---

#### POST `/api/vector/upsert-batch`
Batch upsert candidates into Pinecone.

**Request Body:**
```json
{
  "candidates": [ { /* candidate */ }, { /* candidate */ } ]
}
```

**Response:** `{ "success": true, "upserted": 10, "failed": 0 }`

---

#### DELETE `/api/vector/delete/:mongo_id`
Delete a candidate from Pinecone by MongoDB ID.

**Response:** `{ "success": true }`

---

#### GET `/api/vector/stats`
Get Pinecone index statistics.

**Response:**
```json
{
  "total_vectors": 150,
  "dimensions": 384,
  "index_name": "talentmind-candidates"
}
```

---

### 7. SYNC (MongoDB -> Pinecone)

#### POST `/api/sync/all`
Sync ALL candidates from MongoDB into Pinecone. Idempotent (safe to re-run).

**Response:** `{ "success": true, "total": 100, "upserted": 98, "failed": 2 }`

---

#### POST `/api/sync/one/:mongo_id`
Sync a single candidate from MongoDB to Pinecone.

**Response:** `{ "success": true, "mongo_id": "..." }`

---

### 8. AI HEALTH CHECK

#### GET `/api/health`

**Response (200):**
```json
{
  "status": "ok",
  "gemini_key": true,
  "pinecone_key": true,
  "pinecone_index": "talentmind-candidates",
  "mongo_uri_set": true,
  "mongo_reachable": true,
  "mongo_candidates": 42
}
```

---

## DATA SCHEMAS

### Candidate Object (MongoDB collection: `candidates`)
```json
{
  "_id": "MongoDB ObjectId (auto-generated)",
  "email": "candidate@example.com",
  "fullName": "Jane Smith",
  "phone": "+91-9876543210",
  "applied_role": "software development (always lowercase)",
  "applicationStage": "Applied | Round 1 | Round 2 | Hired | Rejected",
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  },
  "totalExperienceYears": 3.5,
  "skills": ["React", "Node.js", "Python"],
  "experience": [
    {
      "company": "TechCorp",
      "role": "Software Engineer",
      "startDate": "2021-01-01T00:00:00.000Z",
      "endDate": "2024-01-01T00:00:00.000Z",
      "techstack": ["React", "Node.js"],
      "years_worked": "3 years",
      "description": "Built full-stack web apps"
    }
  ],
  "education": [
    {
      "institution": "IIT Bombay",
      "degree": "B.Tech Computer Science",
      "from": 2017,
      "to": 2021,
      "score": "8.5 CGPA"
    }
  ],
  "sourcePlatforms": ["Gmail_Auto_Sync", "External_HRMS", "Manual_Upload"],
  "originalResumeUrls": ["https://res.cloudinary.com/.../resume.pdf"],
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### HR User Object (MongoDB collection: `hr`)
```json
{
  "_id": "MongoDB ObjectId",
  "firstName": "John",
  "lastName": "Doe",
  "email": "hr@company.com",
  "password": "bcrypt hashed (never returned in API)",
  "appPassword": "bcrypt hashed (never returned in API)",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Job Object (MongoDB collection: `jobs`)
```json
{
  "_id": "MongoDB ObjectId",
  "title": "software development (always lowercase)",
  "status": "Active | Completed",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

---

## FRONTEND FLOW & FEATURE REQUIREMENTS

### Page 1: AuthPage (`/`)
- Toggle between **Login** and **Signup** modes
- **Signup fields:** firstName, lastName, email, password, appPassword
- **Login fields:** email, password
- On success, navigate to `/dashboard`
- Use `credentials: "include"` for cookie-based auth
- Show error messages from API

### Page 2: AllCandidates (`/dashboard`) -- Global Talent Pool
- On load, fetch all candidates: `GET /api/v1/users/resumes`
- **Refresh button** (with spinning animation) that triggers:
  1. `GET /api/candidates/sync` (Gmail sync)
  2. `GET /api/candidates/sync-hrms` (HRMS sync)
  3. Re-fetches candidates
- **AI Search Bar** at the top:
  - User types natural language query (e.g., "Find top React developers")
  - On submit: `POST http://localhost:5001/api/chat` with `{ session_id: random, message: query }`
  - Display AI response (can be text or candidate cards)
- **Candidate Cards Grid** showing:
  - fullName, email, location (city, state), applied_role, skills (as badges), totalExperienceYears

### Page 3: JobBoard (`/jobs`) -- Active Roles
- On load, fetch jobs: `GET /api/v1/jobs`
- **Create Job** input + button: `POST /api/v1/jobs` with `{ title }`
- Display job cards showing title and status
- Each job card has "Open Pipeline" button -> navigates to `/portal` with job data in route state

### Page 4: JobPortal (`/portal`) -- Per-Job Pipeline
- Receives `job` object via React Router `location.state`
- **Pipeline Tabs:** Applied, Round 1, Round 2, Hired, Rejected
- Fetch candidates for this role: `GET /api/v1/users/resumes?role={job.title}`
- Filter displayed candidates by `applicationStage` matching active tab
- **Stage promotion buttons** on each candidate card:
  - Applied -> "Move to Round 1" button
  - Round 1 -> "Move to Round 2" button
  - Round 2 -> "Hire" and "Reject" buttons
  - API call: `PUT /api/v1/users/stage/{candidateId}` with `{ stage: "Round 1" }` etc.
- **AI Smart Match** (on "Applied" tab only):
  1. Fetch eligible candidates: `GET /api/v1/users/ai-match-filter?role={job.title}`
  2. Get their IDs, send to AI: `POST http://localhost:5001/api/match/job-description` with `{ job_description, candidate_ids, top_k: 3 }`
  3. Display matched candidates with AI scores and reasons
- **Delete Job** button (with confirmation): `DELETE /api/v1/jobs/{jobId}` -- warns that all candidates will be removed

### Page 5: UploadPage (`/upload`) -- Resume Upload
- Drag-and-drop zone for PDF files
- Optional "Job Role" text input
- Upload: `POST /api/v1/users/upload-manual` as `multipart/form-data` with fields `pdfFile` and optional `appliedRole`
- Show upload progress states: idle, processing, success, error
- On success, display the returned Cloudinary PDF URL as a clickable link

---

## DESIGN REQUIREMENTS

- **Style:** Modern, clean, professional SaaS HR dashboard
- **Color Scheme:** Dark navy/slate primary (#2c3e50), white cards, blue accents (#3498db), purple for AI features (#8e44ad), green for success (#27ae60), red for destructive actions (#e74c3c)
- **Typography:** System UI / Inter font family, clean hierarchy
- **Layout:** Responsive grid, card-based layouts, proper spacing
- **Components to use:** Shadcn/UI or similar component library for polished look
- **Animations:** Smooth transitions, loading spinners, skeleton loaders, success/error toasts
- **AI features should feel special:** AI search bar and AI Smart Match should have a distinct purple/gradient accent to signal "AI-powered"
- **Pipeline view:** Kanban-style columns or tab-based view with clear visual separation between stages
- **Candidate cards should show:** Avatar placeholder (initials), name, email, location, skills as colored badges, experience years, source platform badge, resume PDF link
- **Mobile responsive** but primarily designed for desktop HR workflows

---

## ARCHITECTURE DIAGRAM

```
Browser (React Frontend :5173)
  |
  |-- Auth, CRUD, Jobs, Upload, Sync triggers
  |       |
  |       v
  |   Node.js Backend (:8080)
  |       |
  |       |-- MongoDB Atlas (candidates, hr, jobs collections)
  |       |-- Cloudinary (PDF storage)
  |       |-- Data-Extraction (:8000) -- Gemini AI resume parsing
  |       |-- Email Scraper (:5003) -- Gmail IMAP email fetcher
  |       |-- Chat-Bot (:5001) /api/sync/all -- post-sync Pinecone update
  |
  |-- AI Chat & AI Smart Match
          |
          v
      Chat-Bot Flask (:5001)
          |
          |-- Gemini LLM (OpenAI-compatible API)
          |-- Pinecone Vector DB (semantic search)
          |-- MongoDB Atlas (reads candidate data)
```

---

## IMPORTANT IMPLEMENTATION NOTES

1. **CORS:** Backend accepts all origins (`origin: true`). No CORS issues expected.
2. **Auth cookies:** Login sets httpOnly cookie. Use `credentials: "include"` in all fetch/axios calls if you want cookie-based auth. The token is also returned in the JSON response body.
3. **AI Chat responses** are flexible -- the `response` field can be a string, object, or array. Frontend should handle all formats gracefully.
4. **Job titles are always lowercase** in the database. The UI should display them with proper capitalization but send them as-is.
5. **Pipeline stages** are exactly: `"Applied"`, `"Round 1"`, `"Round 2"`, `"Hired"`, `"Rejected"`. These are case-sensitive strings.
6. **File uploads** use `multer` on the backend. Send as `multipart/form-data` with field name `pdfFile`.
7. **Sync operations** can take time (up to 30 seconds). Show appropriate loading states.
8. **The `rank` endpoint** (`GET /api/v1/users/rank/{jobTitle}`) is referenced in some frontend pages but has no corresponding backend route implemented. You may skip this or show a placeholder.
