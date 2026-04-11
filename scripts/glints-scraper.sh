#!/bin/bash
# DEPRECATED: This is a placeholder script.
# Real scraping is now done via Puppeteer in scripts/scraper/puppeteer-runner.ts
# This file is kept for backwards compatibility reference.
set -euo pipefail

keyword="${KEYWORD:-frontend engineer}"

title=$(echo "$keyword" | sed 's/\b\(.\)/\U\1/g')

cat <<EOF
[
  {
    "title": "${title}",
    "company": "Glints Sample Co",
    "location": "Jakarta, Indonesia",
    "url": "https://glints.com/id/opportunities/jobs/sample-role",
    "description_snippet": "Replay script placeholder for ${keyword}",
    "full_description": "Recorded scraper placeholder output until agent-browser recording is added."
  }
]
EOF