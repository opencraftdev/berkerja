#!/bin/bash
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