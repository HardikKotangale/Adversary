#!/usr/bin/env bash
# Deploys Adversary on an Alibaba Cloud ECS instance.
#
# Assumes: Docker + the Compose plugin are already installed on the instance,
# this repo is cloned there, and a root .env file exists (copy .env.example
# and fill it in — see README.md).
#
# Usage: ./deploy.sh

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing .env at repo root. Copy .env.example to .env and fill in your credentials first." >&2
  exit 1
fi

echo "==> Pulling latest changes"
git pull

echo "==> Building images"
docker compose build

echo "==> Starting containers"
docker compose up -d --remove-orphans

echo "==> Pruning dangling images"
docker image prune -f

echo "==> Running containers:"
docker compose ps

echo "==> Done. The app is served on port 80."
