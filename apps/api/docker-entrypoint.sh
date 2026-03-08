#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed only if no users exist (first deploy)
USER_COUNT=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.user.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "No users found — running seed..."
  npx prisma db seed
fi

echo "Starting application..."
exec node dist/main
