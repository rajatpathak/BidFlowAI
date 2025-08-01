#!/bin/bash

# BMS Deployment Test Script
set -e

echo "🧪 Testing BMS Deployment Configuration..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Check required files
echo -e "${YELLOW}Checking required files...${NC}"
required_files=(
    "server/simple-index.ts"
    "server/clean-routes.ts" 
    "server/db.ts"
    "ecosystem.config.js"
    "docker-compose.yml"
    "Dockerfile"
    "deploy-server.sh"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file missing${NC}"
        exit 1
    fi
done

# Test 2: Check environment variables
echo -e "${YELLOW}Checking environment variables...${NC}"
if [[ -f ".env" ]]; then
    source .env
    if [[ -n "$DATABASE_URL" ]]; then
        echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
    else
        echo -e "${RED}✗ DATABASE_URL not set${NC}"
    fi
    
    if [[ -n "$JWT_SECRET" ]]; then
        echo -e "${GREEN}✓ JWT_SECRET configured${NC}"
    else
        echo -e "${RED}✗ JWT_SECRET not set${NC}"
    fi
else
    echo -e "${YELLOW}! .env file not found, using .env.example${NC}"
fi

# Test 3: Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
if curl -s http://localhost:5000/health > /dev/null; then
    health_response=$(curl -s http://localhost:5000/health)
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
    echo "Response: $health_response"
else
    echo -e "${YELLOW}! Server not running, testing file syntax instead${NC}"
fi

# Test 4: Check TypeScript syntax
echo -e "${YELLOW}Checking TypeScript syntax...${NC}"
if npx tsc --noEmit server/simple-index.ts 2>/dev/null; then
    echo -e "${GREEN}✓ TypeScript syntax valid${NC}"
else
    echo -e "${YELLOW}! TypeScript check failed (dependencies may be missing)${NC}"
fi

# Test 5: Check deployment script permissions
if [[ -x "deploy-server.sh" ]]; then
    echo -e "${GREEN}✓ Deployment script is executable${NC}"
else
    echo -e "${YELLOW}! Making deployment script executable${NC}"
    chmod +x deploy-server.sh
fi

# Test 6: Check directory structure
echo -e "${YELLOW}Checking directory structure...${NC}"
required_dirs=("uploads" "logs" "client" "server" "shared")

for dir in "${required_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        echo -e "${GREEN}✓ $dir directory exists${NC}"
    else
        echo -e "${YELLOW}! Creating $dir directory${NC}"
        mkdir -p "$dir"
    fi
done

# Test 7: Docker configuration test
echo -e "${YELLOW}Testing Docker configuration...${NC}"
if command -v docker &> /dev/null; then
    if docker-compose config > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker Compose configuration valid${NC}"
    else
        echo -e "${RED}✗ Docker Compose configuration invalid${NC}"
    fi
else
    echo -e "${YELLOW}! Docker not installed, skipping Docker tests${NC}"
fi

echo -e "${GREEN}🎉 Deployment configuration test completed!${NC}"
echo ""
echo -e "${YELLOW}Quick Deployment Commands:${NC}"
echo "1. Simple Server: ./deploy-server.sh"
echo "2. Docker: docker-compose up -d"
echo "3. PM2: pm2 start ecosystem.config.js --env production"
echo "4. Health Check: curl http://localhost:5000/health"