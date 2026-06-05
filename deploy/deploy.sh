#!/bin/bash
set -e

# Usage: ./deploy/deploy.sh [prod|uat|test]
ENV=${1:-prod}

case "$ENV" in
  prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    BRANCH="main"
    ;;
  uat)
    COMPOSE_FILE="docker-compose.uat.yml"
    BRANCH="develop"
    ;;
  test)
    COMPOSE_FILE="docker-compose.test.yml"
    BRANCH="develop"
    ;;
  *)
    echo "Usage: $0 [prod|uat|test]"
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$(dirname "$API_DIR")/liftforge-web"

echo "╔══════════════════════════════════════════════╗"
echo "  Deploying LiftForge — environment: $ENV"
echo "╚══════════════════════════════════════════════╝"

# ── Pull latest code ────────────────────────────────────────────────────────
echo ""
echo "▶ Pulling latest code ($BRANCH)..."
cd "$API_DIR" && git fetch origin && git checkout "$BRANCH" && git pull origin "$BRANCH"
cd "$WEB_DIR" && git fetch origin && git checkout "$BRANCH" && git pull origin "$BRANCH"

# ── Build and (re)start containers ─────────────────────────────────────────
echo ""
echo "▶ Building images..."
cd "$API_DIR"
docker compose -f "$COMPOSE_FILE" build

echo ""
echo "▶ Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo ""
echo "▶ Waiting for containers to be healthy..."
sleep 5
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "✅ Deploy complete — environment: $ENV"
echo ""
echo "   Frontend : check https://$([ "$ENV" = "prod" ] && echo "liftforge.xyz" || echo "$ENV.liftforge.xyz")"
echo "   API docs : check https://$([ "$ENV" = "prod" ] && echo "api.liftforge.xyz" || echo "api.$ENV.liftforge.xyz")/api"
echo ""
echo "   View logs:  docker compose -f $COMPOSE_FILE logs -f api"
