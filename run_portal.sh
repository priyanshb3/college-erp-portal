#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting College ERP Portal (Full Stack + Cloudflare Host)"
echo "=========================================================="

cleanup() {
  echo ""
  echo "Shutting down College ERP Portal..."
  kill $(jobs -p) 2>/dev/null || true
  pkill -f "cloudflared tunnel" 2>/dev/null || true
  pkill -f "uvicorn app.main:app" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  rm -f HOSTED_URL.txt /tmp/erp_tunnel.log 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Stop any previously running instances
./stop.sh >/dev/null 2>&1 || true
sleep 1

# 2. Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
  echo "Building frontend distribution..."
  (cd frontend && npm run build)
fi

# 3. Start Backend
echo "[1/3] Starting FastAPI Backend on port 8000..."
cd "$DIR/backend"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 4. Start Frontend dev server
echo "[2/3] Starting React+Vite Frontend on port 5173..."
cd "$DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

cd "$DIR"
# 5. Start Cloudflare Tunnel
echo "[3/3] Starting Cloudflare Tunnel for Public Hosting..."
rm -f /tmp/erp_tunnel.log
cloudflared tunnel --url http://localhost:8000 > /tmp/erp_tunnel.log 2>&1 &
TUNNEL_PID=$!

# Detect Tunnel URL
echo "Establishing secure public HTTPS tunnel..."
TUNNEL_URL=""
for i in {1..30}; do
  sleep 1
  TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/erp_tunnel.log 2>/dev/null | head -n 1 || true)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
done

echo ""
echo "=========================================================="
echo " 🏛️ COLLEGE ERP PORTAL IS LIVE & HOSTED!"
echo "=========================================================="
if [ -n "$TUNNEL_URL" ]; then
  echo " 🌐 Public Hosted URL:  $TUNNEL_URL"
  echo "$TUNNEL_URL" > "$DIR/HOSTED_URL.txt"
else
  echo " 🌐 Public Tunnel URL: Establishing in background (check /tmp/erp_tunnel.log)"
fi
echo " 💻 Local Unified URL:  http://localhost:8000"
echo " ⚡ Local Dev URL:      http://localhost:5173"
echo " 📖 API Documentation:  http://localhost:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to stop all services."
echo ""

wait
