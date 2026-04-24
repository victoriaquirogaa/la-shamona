---
name: app-startup
description: 'Setup and run La Shamona (FastAPI backend + React/Vite frontend). Use when the user asks to start, run, launch, boot, or "arrancar/levantar" the app, after a git pull when dependencies may have changed, when troubleshooting a failed startup, or when onboarding a new developer.'
---

# La Shamona App Startup

Single-command setup for the La Shamona backend + frontend development environment.

## When to Use

- **Starting development** — Fresh session, need both backend and frontend running
- **After `git pull`** — Dependencies may have changed, need to sync
- **Failed startup** — Something broke, want clean initialization
- **New team member** — Onboarding developers to the project

## Quick Start

### Option 1: Automated (recommended)

Run the script from the **project root**:

**Windows (PowerShell):**
```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\startup.ps1
```

**Mac / Linux (Bash):**
```bash
bash ./scripts/startup.sh
```

Both scripts:
1. Verify Python and Node are installed
2. Create `backend/venv` if it doesn't exist
3. Activate the venv and install backend dependencies
4. Install frontend dependencies (if `node_modules` is missing or stale)
5. Launch backend (`uvicorn`) and frontend (`npm run dev`) in parallel

### Option 2: Manual steps

## Prerequisites

- **Python 3.8+** (backend)
- **Node.js 16+** (frontend)
- **Git**

## Manual Procedure

### Backend

1. **Navigate to backend**
   ```bash
   cd backend
   ```

2. **Create venv (first time only)**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**

   Windows (PowerShell):
   ```powershell
   .\venv\Scripts\Activate
   ```

   Mac / Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Install/sync dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start FastAPI server**
   ```bash
   uvicorn main:app --reload
   ```

   Backend runs on `http://localhost:8000` — docs at `http://localhost:8000/docs`.

### Frontend

1. **In a new terminal, navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies (first time or after updates)**
   ```bash
   npm install
   ```

3. **Start dev server**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `venv not found` | Create with `python -m venv venv` inside `/backend` |
| Frontend won't start | Run `npm install` in `/frontend` |
| Port 8000 already in use | Kill the process or change port: `uvicorn main:app --reload --port 8001` |
| Port 5173 already in use | Vite will auto-pick the next free port |
| CORS errors | Check backend CORS config in `main.py` — should allow `http://localhost:5173` |
| Changed deps, `pip install` fails | Delete `backend/venv`, recreate → activate → `pip install -r requirements.txt` |
| PowerShell blocks `Activate` | Run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
