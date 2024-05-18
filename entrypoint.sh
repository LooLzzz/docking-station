#!/bin/bash

cd ./docking-station-app
concurrently --names=WEB,SERVER --prefix-colors=auto "bun run start" "NODE_ENV=production fastapi run src/app/api/main.py --port ${SERVER_PORT:-3001}"
