# La Shamona - Windows startup script
# Run from repo root: PowerShell -ExecutionPolicy Bypass -File .\scripts\startup.ps1

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "    $msg" -ForegroundColor Red }

# --- Prerequisites ---
Write-Step "Checking prerequisites"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Err "Python not found. Install Python 3.8+ and re-run."
    exit 1
}
Write-Ok "Python: $(python --version)"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js not found. Install Node 16+ and re-run."
    exit 1
}
Write-Ok "Node: $(node --version)"

# --- Repo root check ---
if (-not (Test-Path ".\backend") -or -not (Test-Path ".\frontend")) {
    Write-Err "Run this from the la-shamona repo root (needs backend/ and frontend/ folders)."
    exit 1
}

# --- Backend setup ---
Write-Step "Setting up backend"

Push-Location backend

if (-not (Test-Path ".\venv")) {
    Write-Warn "venv not found — creating it"
    python -m venv venv
}

Write-Ok "Activating venv"
. .\venv\Scripts\Activate.ps1

Write-Ok "Installing backend dependencies"
pip install -r requirements.txt --quiet

Pop-Location

# --- Frontend setup ---
Write-Step "Setting up frontend"

Push-Location frontend

if (-not (Test-Path ".\node_modules")) {
    Write-Warn "node_modules not found — running npm install"
    npm install
} else {
    Write-Ok "node_modules present — skipping install (run 'npm install' manually if package.json changed)"
}

Pop-Location

# --- Launch both servers ---
Write-Step "Launching backend + frontend"

# Backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload"

Start-Sleep -Seconds 2

# Frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Ok "Backend:  http://localhost:8000  (docs: http://localhost:8000/docs)"
Write-Ok "Frontend: http://localhost:5173"
Write-Host ""
Write-Host "Close the two new PowerShell windows to stop the servers." -ForegroundColor Gray
