#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${1:-7769}

# Kill any processes on port $PORT
PIDS=$(lsof -ti :$PORT)
if [ -n "$PIDS" ]; then
  echo "Killing processes on port $PORT: $PIDS"
  kill -9 $PIDS
fi

cd "$SCRIPT_DIR/frontend"
npm run dev -- --port $PORT
