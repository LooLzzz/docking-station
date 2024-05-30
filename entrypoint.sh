#!/bin/bash

cd /app/docking-station-app
cp -n /app/settings.template.yml /config/settings.yml

concurrently --names=WEB,SERVER,AUTO-UPDATER --prefix-colors=auto --kill-others-on-fail \
    "npm run start" \
    "NODE_ENV=production fastapi run src/app/api/main.py --port ${SERVER_PORT:-3001}" \
    "NODE_ENV=production sleep 5 && python -m src.app.api.auto_updater"
