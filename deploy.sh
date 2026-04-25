#!/bin/bash

# Configuration
APP_DIR="/apps/impexina"

# ANSI Color Codes for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Deployment Process...${NC}"

# 1. Navigate to project root
echo -e "${YELLOW}📂 Navigating to $APP_DIR...${NC}"
cd $APP_DIR || { echo -e "${RED}❌ Error: Could not find directory $APP_DIR${NC}"; exit 1; }

# 2. Sync with Git
echo -e "${YELLOW}📥 Fetching latest changes from Git...${NC}"
# Discard local changes to avoid merge conflicts
git checkout .
git pull origin main || { echo -e "${RED}❌ Error: Git pull failed${NC}"; exit 1; }

# 3. Frontend Build
echo -e "${BLUE}🏗️  Step 1: Building Frontend...${NC}"
cd frontend
echo -e "${YELLOW}   Installing dependencies...${NC}"
npm install --silent
echo -e "${YELLOW}   Running build script...${NC}"
npm run build || { echo -e "${RED}❌ Error: Frontend build failed${NC}"; exit 1; }

# 4. Backend Update
echo -e "${BLUE}⚙️  Step 2: Updating Backend...${NC}"
cd ../backend
echo -e "${YELLOW}   Installing dependencies...${NC}"
npm install --silent
echo -e "${YELLOW}   Syncing database schema (prisma db push)...${NC}"
npm run db:dev || { echo -e "${RED}❌ Error: Backend database update failed${NC}"; exit 1; }

# 5. Restart Services
echo -e "${BLUE}🔄 Step 3: Restarting services with PM2...${NC}"
pm2 restart all || { echo -e "${RED}❌ Error: PM2 restart failed${NC}"; exit 1; }

echo -e "${GREEN}✅ Deployment Successful! System is up and running.${NC}"
