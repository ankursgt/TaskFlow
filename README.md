# TaskFlow Task Management Application

A simple full-stack Task Management application with:

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** FastAPI
- **ORM:** SQLAlchemy
- **Database:** SQLite by default
- **API:** REST
- **Frontend server:** Python HTTP server
- **Backend server:** Uvicorn

The application supports creating, viewing, updating, and deleting tasks, along with users, projects, task priorities, due dates, and project-level task statistics.

## Prerequisites

Make sure the following are installed:

- Python 3.10+
- Git
- A modern web browser

Check your Python version:

```bash
python --version
```

---

# Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_NAME>
```

---

# Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

## Create a Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Start the Backend

Run FastAPI using Uvicorn:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

You can also verify the tasks API directly:

```text
http://127.0.0.1:8000/tasks
```

---

# Frontend Setup

Open a **second terminal**.

Navigate to the frontend directory:

```bash
cd frontend
```

Start the Python HTTP server:

```bash
python -m http.server 5500
```

The frontend will be available at:

```text
http://127.0.0.1:5500
```

Open this URL in your browser:

```text
http://127.0.0.1:5500
```

> Do not open `index.html` directly using `file://`. The frontend should be served through the Python HTTP server so that the browser sends requests from a proper HTTP origin.

# Ports

The application uses the following ports during local development:

| Component | URL | Port |
|---|---|---:|
| Frontend | `http://127.0.0.1:5500` | **5500** |
| Backend | `http://127.0.0.1:8000` | **8000** |
| Swagger UI | `http://127.0.0.1:8000/docs` | **8000** |

The frontend JavaScript communicates with the backend using:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

---

# CORS Configuration

The backend allows requests from both common local frontend origins:

```text
http://127.0.0.1:5500
http://localhost:5500
```

FastAPI CORS configuration:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
    ],
)
```

If you change the frontend port, update `allow_origins` in `main.py` accordingly.

For example, if the frontend runs on port `5501`:

```python
allow_origins=[
    "http://localhost:5501",
]
```

---

# REST API

## Users

### Create User

```http
POST /users
```

Example request:

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

### List Users

```http
GET /users
```

---

## Projects

### Create Project

```http
POST /projects
```

Example:

```json
{
  "name": "ShopEasy",
  "owner_id": 1
}
```

### List Projects

```http
GET /projects
```

---

## Tasks

### Create Task

```http
POST /tasks
```

Example:

```json
{
  "title": "Create database schema",
  "priority": "high",
  "due_date": "next friday",
  "project_id": 1
}
```

Allowed priority values:

```text
low
medium
high
```

### List Tasks

```http
GET /tasks
```

### List Tasks by priority

```http
GET /tasks?sort=priority
```

### Get Task

```http
GET /tasks/{task_id}
```

Example:

```text
GET /tasks/1
```

### Update Task

```http
PUT /tasks/{task_id}
```

Example:

```json
{
  "title": "Update database schema",
  "priority": "medium"
}
```

### Delete Task

```http
DELETE /tasks/{task_id}
```

Example:

```text
DELETE /tasks/1
```

---

# Task Statistics

The backend also provides project-level task statistics:

```http
GET /tasks/statistics/by-project
```

Example response:

```json
[
  {
    "project_id": 1,
    "project_name": "ShopEasy",
    "task_count": 5,
    "pending_count": 2,
    "in_progress_count": 1,
    "completed_count": 2
  }
]
```

The statistics are calculated using SQL aggregation with `COUNT`, `SUM`, `CASE`, and `GROUP BY`.

---

# Database

Database used is Supabase with URL:
```text
"postgresql://postgres.zuaueheflpxczyzousrs:<password>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

It is automatically created when the FastAPI application starts.

The database contains:

```text
users
   │
   │ owner_id
   ▼
projects
   │
   │ project_id
   ▼
tasks
```

### Users

```text
users
----------------
id       PK
email    UNIQUE
name
```

### Projects

```text
projects
----------------
id        PK
name
owner_id  FK → users.id
```

### Tasks

```text
tasks
----------------
id           PK
title        NOT NULL
description
priority     low | medium | high
status
due_date     TEXT / nullable
project_id   FK → projects.id
```

The `due_date` column intentionally stores raw text.

Both of the following are valid:

```text
2026-08-21
```

and:

```text
next friday
```

---

# Local Storage

The frontend caches the current task list in the browser's `localStorage`.

The cached data is stored as JSON:

```javascript
localStorage.setItem(
    "task-manager-tasks",
    JSON.stringify(tasks)
);
```

When the application starts:

1. Cached tasks are loaded immediately.
2. Cached tasks are rendered.
3. The backend is requested in parallel.
4. The latest backend data replaces the cached data.
5. The updated task list is cached again.

This prevents the UI from appearing blank while the backend request is in progress.

---

# Development Workflow

You need **two terminals**.

### Terminal 1 — Backend

```bash
cd backend

# Activate virtual environment if required
venv\Scripts\activate

uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 — Frontend

```bash
cd frontend

python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```

---

# Troubleshooting

## CORS Error

Make sure the frontend is running on port `5500`:

```bash
python -m http.server 5500
```

Then verify that `main.py` contains:

```python
allow_origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]
```

Restart the backend after changing the CORS configuration.

---

## Backend Not Reachable

Verify:

```text
http://127.0.0.1:8000/docs
```

If the Swagger UI doesn't open, start the backend again:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## Frontend Not Loading

Make sure you started the HTTP server from the `frontend` directory:

```bash
cd frontend
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```

Do not use:

```text
file:///.../index.html
```

---

# HTTP Status Codes

The API uses standard HTTP status codes:

| Status | Meaning |
|---:|---|
| `200` | Successful read/update/delete |
| `201` | Resource successfully created |
| `404` | Resource not found |
| `409` | Duplicate user email |
| `422` | Request validation failed |

---

# Quick Add Parser

The quick-add parser uses a zero-shot prompting approach. The system prompt describes the expected parsing behavior without providing example demonstrations. The deterministic mock implements the same rules directly so the feature works without an API key or network call.

Zero-shot is appropriate here because the expected output has a small, explicitly defined schema and closed vocabulary. It also minimizes prompt tokens compared with few-shot prompting, while the deterministic rules provide stronger response reliability than relying on an LLM to infer the rules. Chain-of-thought is intentionally not used because intermediate reasoning is unnecessary for this deterministic classification and extraction task.

Example 1

Input:

This is urgent, mark it ASAP please

Output:

{
  "title": "This is , mark it please",
  "priority": "high",
  "due_date_hint": null
}
Example 2

Input:




Output:

{
  "title": "Untitled task",
  "priority": "medium",
  "due_date_hint": null
}

For a whitespace-only input such as " ", the same output is produced.

Example 3

Input:

Finish the report next Friday, it's urgent

Output:

{
  "title": "Finish the report , it's",
  "priority": "high",
  "due_date_hint": "next friday"
}
Example 4

Input:

tomorrow review tomorrow

Output:

{
  "title": "review",
  "priority": "medium",
  "due_date_hint": "tomorrow"
}
Example 5

Input:

Prepare the presentation whenever next Monday

Output:

{
  "title": "Prepare the presentation",
  "priority": "low",
  "due_date_hint": "next monday"
}

---

# Algorithm Verification

The repository includes:

check_algorithms.py

This script verifies the insertion-sort implementation independently
of the FastAPI application.

Run:
```text
python check_algorithms.py
```

A successful run prints:
```text
PASS: insertion_sort correctly sorts records in place
```

# Tech Stack

- HTML5
- CSS3
- JavaScript
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite
- Uvicorn
- Python
- REST API
- Browser Local Storage

---

# License

Add your preferred license here, for example MIT License.