#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting & Hosting College ERP Portal"
echo "=========================================================="

# 1. Stop any currently running instances
./stop.sh >/dev/null 2>&1 || true
sleep 1

# 2. Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
  echo "Building frontend..."
  (cd frontend && npm run build)
fi

# 3. Start Backend (serves API + SPA frontend on port 8000)
echo "[1/3] Starting backend (FastAPI) on port 8000..."
(cd backend && source venv/bin/activate && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &)

# 4. Start Vite Dev Server on port 5173
echo "[2/3] Starting frontend dev server on port 5173..."
(cd frontend && nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &)

# Wait a moment for backend to initialize
sleep 2

# 5. Start Cloudflare Tunnel for public hosting
echo "[3/3] Launching Cloudflare public tunnel for port 8000..."
rm -f /tmp/erp_tunnel.log
nohup cloudflared tunnel --url http://localhost:8000 > /tmp/erp_tunnel.log 2>&1 &

echo "Waiting for public tunnel URL..."
TUNNEL_URL=""
for i in {1..25}; do
  sleep 1
  TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/erp_tunnel.log 2>/dev/null | head -n 1 || true)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
done

echo ""
echo "=========================================================="
echo " 🚀 COLLEGE ERP PORTAL IS LIVE!"
echo "=========================================================="
if [ -n "$TUNNEL_URL" ]; then
  echo " 🌐 Public Hosted URL:  $TUNNEL_URL"
  echo "$TUNNEL_URL" > HOSTED_URL.txt
else
  echo " ⚠️  Could not detect public tunnel URL yet. Check /tmp/erp_tunnel.log"
fi
echo " 💻 Local Unified URL:  http://localhost:8000"
echo " ⚡ Local Dev URL:      http://localhost:5173"
echo " 📖 API Documentation:  http://localhost:8000/docs"
echo "=========================================================="
echo ""
