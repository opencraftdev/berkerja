#!/bin/bash
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
