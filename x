#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail
set -o noglob

cmd:format() {
  deno fmt src
}

cmd:check() {
  deno lint src
  deno fmt --check src
  npx tsc --noEmit
}

cmd:clean() {
  rm -rf dist
}

cmd:dev() {
  cmd:clean
  mkdir -p dist

  open "http://localhost:8009/example"

  npx esbuild src/index.ts \
    --bundle \
    --outfile=dist/chat-ui.js \
    --watch=forever \
    --servedir=. \
    --serve=8009
}

cmd:build() {
  cmd:clean
  mkdir -p dist

  npx esbuild src/index.ts \
    --bundle \
    --minify \
    --outfile=dist/chat-ui.js
}

cmd:publish() {
  git branch -D production || true
  git checkout -b production main

  npm install
  cmd:build

  ls | grep -v dist | xargs rm -rf
  
  set +o noglob
  mv dist/* .
  set -o noglob

  rm -rf dist

  git add .
  git commit -m "Publish"
  git push -f

  git checkout main
  npm install
}

(
  cd $(dirname "$0")
  "cmd:$@"
)
