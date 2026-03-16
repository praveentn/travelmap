#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${1:-7768}

# Kill any processes on port $PORT
PIDS=$(lsof -ti :$PORT)
if [ -n "$PIDS" ]; then
  echo "Killing processes on port $PORT: $PIDS"
  kill -9 $PIDS
fi

cd "$SCRIPT_DIR/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port $PORT
