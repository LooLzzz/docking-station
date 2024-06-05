#!/bin/bash

cd ./docking-station-app

ln -snf /app ../app
concurrently --names=BUN,PIP --prefix-colors=auto \
    "bun install" \
    "pip install notebook -r requirements.txt"
