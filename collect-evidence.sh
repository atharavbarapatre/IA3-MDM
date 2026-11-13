#!/usr/bin/env bash
# Collects evidence for your submission: tool versions, running container, app output.
set -u
OUT="evidence-$(date +%Y%m%d-%H%M%S).txt"
{
  echo "### Date: $(date)"
  echo "### Tool versions"
  java -version 2>&1 | head -1; docker --version; node --version; terraform version | head -1
  echo; echo "### Running containers"
  docker ps --filter name=demo-app
  echo; echo "### App response"
  curl -s localhost:3000/; echo
  curl -s localhost:3000/health; echo
  curl -s localhost:3000/add/10/20; echo
} | tee "$OUT"
echo "Saved to $OUT"
