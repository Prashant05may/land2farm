#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yaml"
ACTION="${1:-up}"

case "${ACTION}" in
  up)
    docker compose -f "${COMPOSE_FILE}" up --build -d
    ;;
  down)
    docker compose -f "${COMPOSE_FILE}" down
    ;;
  restart)
    docker compose -f "${COMPOSE_FILE}" down
    docker compose -f "${COMPOSE_FILE}" up --build -d
    ;;
  build)
    docker compose -f "${COMPOSE_FILE}" build
    ;;
  *)
    echo "Usage: $0 [up|down|restart|build]"
    exit 1
    ;;
esac
