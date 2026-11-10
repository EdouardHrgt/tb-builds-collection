#!/usr/bin/env bash
# Deploys the latest version on the server. Run it from the project folder: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

git pull --ff-only
(cd client && npm ci && npm run build)
(cd server && npm ci --omit=dev)
sudo systemctl restart sigmar
sleep 2
systemctl is-active --quiet sigmar && echo "Deployed: the site is running." || { echo "The service did not start, see: journalctl -u sigmar -n 50"; exit 1; }
