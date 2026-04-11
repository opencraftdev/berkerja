#!/bin/bash
set -euo pipefail

keyword="${KEYWORD:-frontend engineer}"

cat <<EOF
[
  {
    "title": "${keyword^}",
    "company": "JobStreet Sample Co",
    "location": "Remote",
    "url": "https://www.jobstreet.com/id/job/sample-role",
    "description_snippet": "Replay script placeholder for ${keyword}",
    "full_description": "Recorded scraper placeholder output until agent-browser recording is added."
  }
]
EOF
