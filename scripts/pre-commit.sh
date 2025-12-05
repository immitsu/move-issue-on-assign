#!/bin/bash

if git diff --cached --name-only | grep -q 'src/main.mjs'; then
  echo '👀 src/main.mjs changed, running build...'
  pnpm run build
  git add dist/
fi
