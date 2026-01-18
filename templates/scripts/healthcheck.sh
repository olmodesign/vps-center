#!/bin/bash
# Health Check Script

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Health Check"
echo "============"

echo -n "Frontend: "
curl -sf http://localhost/ > /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"

echo -n "Backend:  "
curl -sf http://localhost:3000/api/health > /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"

echo -n "Database: "
docker compose exec -T postgres pg_isready > /dev/null 2>&1 && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"
