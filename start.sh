#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting College ERP Faculty-Student Appointment Portal"
echo "=========================================================="

# Make sure runner is executable
chmod +x backend/run.sh

# Start FastAPI backend
echo "[1/2] Launching Python FastAPI Backend on port 8000..."
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start Vite Frontend
cd "$DIR/frontend"
echo "[2/2] Launching React+Vite Frontend on port 5173..."
npm run dev -- --host 0.0.0.0 --port 5173
