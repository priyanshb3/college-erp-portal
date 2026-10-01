#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Stopping College ERP Portal services..."

# Kill cloudflared tunnel
pkill -f "cloudflared tunnel" 2>/dev/null || true

# Kill uvicorn on port 8000
UVICORN_PIDS=$(lsof -ti:8000 2>/dev/null || ss -lptn 'sport = :8000' 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2)
if [ -n "$UVICORN_PIDS" ]; then
  echo "Stopping backend (port 8000, PID: $UVICORN_PIDS)..."
  kill $UVICORN_PIDS 2>/dev/null || true
fi

# Kill vite on port 5173
VITE_PIDS=$(lsof -ti:5173 2>/dev/null || ss -lptn 'sport = :5173' 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2)
if [ -n "$VITE_PIDS" ]; then
  echo "Stopping frontend (port 5173, PID: $VITE_PIDS)..."
  kill $VITE_PIDS 2>/dev/null || true
fi

pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

rm -f HOSTED_URL.txt /tmp/erp_tunnel.log 2>/dev/null || true

echo "College ERP Portal services stopped."
