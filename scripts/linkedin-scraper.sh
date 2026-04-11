#!/bin/bash
# DEPRECATED: This is a placeholder script.
# Real scraping is now done via Puppeteer in scripts/scraper/puppeteer-runner.ts
# This file is kept for backwards compatibility reference.
set -euo pipefail

keyword="${KEYWORD:-frontend engineer}"

cat <<EOF
[
  {
    "title": "${keyword^}",
    "company": "LinkedIn Sample Co",
    "location": "Singapore",
    "url": "https://www.linkedin.com/jobs/view/sample-role",
    "description_snippet": "Dynamic scraping placeholder for ${keyword}",
    "full_description": "LinkedIn selector changes still need a live agent-browser recording."
  }
]
EOF
