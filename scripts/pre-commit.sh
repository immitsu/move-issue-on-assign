#!/bin/bash

if git diff --cached --name-only | grep -q 'src/main.js'; then
  echo '👀 src/main.js changed, running build...'
  pnpm run build
  git add dist/
fi
