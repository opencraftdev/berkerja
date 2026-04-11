#!/bin/bash
set -euo pipefail

KEYWORD="${1:-frontend developer}"
OUTPUT_FILE="${2:-/tmp/glints-jobs.json}"

if ! command -v agent-browser &> /dev/null; then
  echo "Error: agent-browser not found" >&2
  exit 1
fi

agent-browser open "https://glints.com/jobs"
agent-browser fill @search-input "${KEYWORD}"
agent-browser click @search-button
sleep 2

agent-browser snapshot > "${OUTPUT_FILE}"
agent-browser close