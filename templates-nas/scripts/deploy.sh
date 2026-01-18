#!/bin/bash
# Deploy a VPS

set -e

VPS_USER="root"
VPS_HOST="82.112.242.139"
PROJECT_NAME="${PROJECT_NAME:-mi-proyecto}"
VPS_PATH="/opt/${PROJECT_NAME}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Deploy a VPS${NC}"

# Verificar cambios
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Hay cambios sin commitear${NC}"
    git status -s
    read -p "¿Continuar de todos modos? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push
echo -e "${GREEN}[1/3] Push a GitHub...${NC}"
git push origin main

# Deploy en VPS
echo -e "${GREEN}[2/3] Conectando al VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
    cd ${VPS_PATH}
    echo "[3/3] Pull y rebuild..."
    git pull origin main
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
    docker compose ps
ENDSSH

echo -e "${GREEN}✓ Deploy completado${NC}"
