#!/bin/bash

if git diff --cached --name-only | grep -q '^src/'; then
  echo '👀 files in src/ changed, running build...'
  pnpm run build
  git add dist/
fi
