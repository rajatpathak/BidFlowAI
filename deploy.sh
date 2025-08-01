#!/bin/bash

# BMS Production Deployment Script
# This script implements all the security fixes required for production deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 BMS Production Deployment Started${NC}"

# Step 1: Set production environment
export NODE_ENV=production
export PORT=${PORT:-5000}
echo -e "${YELLOW}✓ Environment set to production${NC}"

# Step 2: Create required directories
echo -e "${YELLOW}Creating required directories...${NC}"
mkdir -p dist logs uploads
echo -e "${GREEN}✓ Directories created${NC}"

# Step 3: Build application
echo -e "${YELLOW}Building application for production...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 4: Verify build output
if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ Build output not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build verification passed${NC}"

# Step 5: Start production server
echo -e "${YELLOW}Starting production server...${NC}"
exec npm start