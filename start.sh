#!/bin/bash

# Secure Vault Storage - Startup Script
# This script starts the backend, frontend, and optionally the database in separate terminal tabs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Secure Vault Storage - Startup Script   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed. Please install Go 1.25+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Go found: $(go version)${NC}"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Please install Bun from https://bun.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Bun found: $(bun --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed. Please install PostgreSQL 14+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL found: $(psql --version)${NC}"

echo ""

# Check if database exists
echo -e "${YELLOW}Checking database...${NC}"
if psql -lqt | cut -d \| -f 1 | grep -qw pswd; then
    echo -e "${GREEN}✓ Database 'pswd' exists${NC}"
else
    echo -e "${YELLOW}⚠ Database 'pswd' not found. Creating...${NC}"
    createdb pswd || {
        echo -e "${RED}❌ Failed to create database${NC}"
        exit 1
    }
    psql pswd -c "CREATE USER pswd WITH ENCRYPTED PASSWORD 'pswd'; GRANT ALL PRIVILEGES ON DATABASE pswd TO pswd; ALTER DATABASE pswd OWNER TO pswd;" || {
        echo -e "${RED}❌ Failed to setup database user${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database created successfully${NC}"
fi

echo ""

# Install dependencies if needed
echo -e "${YELLOW}Checking dependencies...${NC}"

if [ ! -d "backend/vendor" ] && [ ! -f "backend/go.sum" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    go mod download
    cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies OK${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    bun install
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies OK${NC}"
fi

echo ""
echo -e "${GREEN}All prerequisites met! Starting services...${NC}"
echo ""

# Detect terminal and OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo -e "${BLUE}Starting on macOS...${NC}"
    
    # Backend tab
    osascript -e "tell application \"Terminal\"
        do script \"cd '$SCRIPT_DIR/backend' && echo '🚀 Starting Backend Server...' && go run cmd/server/main.go\"
    end tell" &
    
    sleep 2
    
    # Frontend tab
    osascript -e "tell application \"Terminal\"
        do script \"cd '$SCRIPT_DIR/frontend' && echo '🎨 Starting Frontend Dev Server...' && bun run dev\"
    end tell" &
    
    echo -e "${GREEN}✓ Backend started in new tab${NC}"
    echo -e "${GREEN}✓ Frontend started in new tab${NC}"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo -e "${BLUE}Starting on Linux...${NC}"
    
    # Try different terminal emulators
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --tab --title="Backend" -- bash -c "cd '$SCRIPT_DIR/backend' && echo '🚀 Starting Backend Server...' && go run cmd/server/main.go; exec bash" &
        gnome-terminal --tab --title="Frontend" -- bash -c "cd '$SCRIPT_DIR/frontend' && echo '🎨 Starting Frontend Dev Server...' && bun run dev; exec bash" &
    elif command -v konsole &> /dev/null; then
        konsole --new-tab -e bash -c "cd '$SCRIPT_DIR/backend' && echo '🚀 Starting Backend Server...' && go run cmd/server/main.go" &
        konsole --new-tab -e bash -c "cd '$SCRIPT_DIR/frontend' && echo '🎨 Starting Frontend Dev Server...' && bun run dev" &
    elif command -v xterm &> /dev/null; then
        xterm -hold -e "cd '$SCRIPT_DIR/backend' && echo '🚀 Starting Backend Server...' && go run cmd/server/main.go" &
        xterm -hold -e "cd '$SCRIPT_DIR/frontend' && echo '🎨 Starting Frontend Dev Server...' && bun run dev" &
    else
        echo -e "${YELLOW}⚠ No supported terminal found. Starting in background...${NC}"
        cd "$SCRIPT_DIR/backend"
        go run cmd/server/main.go > ../backend.log 2>&1 &
        BACKEND_PID=$!
        cd "$SCRIPT_DIR/frontend"
        bun run dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo -e "${GREEN}✓ Backend PID: $BACKEND_PID (log: backend.log)${NC}"
        echo -e "${GREEN}✓ Frontend PID: $FRONTEND_PID (log: frontend.log)${NC}"
    fi
    
else
    echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
    echo -e "${YELLOW}Please start manually:${NC}"
    echo -e "  Terminal 1: cd backend && go run cmd/server/main.go"
    echo -e "  Terminal 2: cd frontend && bun run dev"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Services Started Successfully!    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:8080"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo ""
echo -e "${YELLOW}Press Ctrl+C in each terminal tab to stop the services${NC}"
echo ""
