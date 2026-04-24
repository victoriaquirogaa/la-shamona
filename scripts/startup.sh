#!/usr/bin/env bash
# La Shamona - Mac/Linux startup script
# Run from repo root: bash ./scripts/startup.sh

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

step() { echo -e "\n${CYAN}==> $1${NC}"; }
ok()   { echo -e "    ${GREEN}$1${NC}"; }
warn() { echo -e "    ${YELLOW}$1${NC}"; }
err()  { echo -e "    ${RED}$1${NC}"; }

# --- Prerequisites ---
step "Checking prerequisites"

if ! command -v python3 >/dev/null 2>&1; then
    err "Python 3 not found. Install Python 3.8+ and re-run."
    exit 1
fi
ok "Python: $(python3 --version)"

if ! command -v node >/dev/null 2>&1; then
    err "Node.js not found. Install Node 16+ and re-run."
    exit 1
fi
ok "Node: $(node --version)"

# --- Repo root check ---
if [ ! -d "./backend" ] || [ ! -d "./frontend" ]; then
    err "Run this from the la-shamona repo root (needs backend/ and frontend/ folders)."
    exit 1
fi

# --- Backend setup ---
step "Setting up backend"

cd backend

if [ ! -d "./venv" ]; then
    warn "venv not found — creating it"
    python3 -m venv venv
fi

ok "Activating venv"
# shellcheck disable=SC1091
source venv/bin/activate

ok "Installing backend dependencies"
pip install -r requirements.txt --quiet

cd ..

# --- Frontend setup ---
step "Setting up frontend"

cd frontend

if [ ! -d "./node_modules" ]; then
    warn "node_modules not found — running npm install"
    npm install
else
    ok "node_modules present — skipping install (run 'npm install' manually if package.json changed)"
fi

cd ..

# --- Launch both servers ---
step "Launching backend + frontend"

# Start backend in background
(
    cd backend
    # shellcheck disable=SC1091
    source venv/bin/activate
    uvicorn main:app --reload
) &
BACKEND_PID=$!

sleep 2

# Start frontend in background
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

echo ""
ok "Backend:  http://localhost:8000  (docs: http://localhost:8000/docs)  [PID $BACKEND_PID]"
ok "Frontend: http://localhost:5173  [PID $FRONTEND_PID]"
echo ""
echo -e "${GRAY}Press Ctrl+C to stop both servers.${NC}"

# Kill both on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for both
wait
