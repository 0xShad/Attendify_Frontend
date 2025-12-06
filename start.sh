#!/bin/sh
set -e

echo "Starting Next.js application..."
echo "PORT: ${PORT:-8080}"
echo "NODE_ENV: ${NODE_ENV}"

exec npm start
