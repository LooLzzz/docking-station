#!/bin/bash

cd ./docking-station-app

ln -snf /app ../app
concurrently --names=BUN,UV --prefix-colors=auto \
    "bun install" \
    "uv sync --all-groups"
