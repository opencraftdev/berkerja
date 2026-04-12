"""
Glints job scraper agent using Browser Use.

Run with visible browser so you can watch the agent interact with Glints in real-time.
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Load from root .env.local (Next.js convention)
_root_env = Path(__file__).parent.parent.parent / ".env.local"
load_dotenv(_root_env, override=True)

# ── Logging setup ─────────────────────────────────────────────────────────────

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / f"glints_{datetime.now():%Y%m%d_%H%M%S}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("glints_agent")


# ── Agent ────────────────────────────────────────────────────────────────────


async def run_agent(keyword: str, max_jobs: int) -> dict:
    """
    Run Browser Use agent with visible browser (demo_mode=True).
    This opens a browser window showing the agent's actions in real-time.
    """
    from browser_use import Agent
    from opencode_llm import OpenCodeLLM

    log.info("Starting Glints agent for keyword=%r, max_jobs=%d", keyword, max_jobs)
    log.info("OpenCode LLM wrapper — make sure 'opencode acp --port 8080' is running")

    llm = OpenCodeLLM()

    task = f"""Go to https://glints.com/id/opportunities/jobs?query={keyword}.

Scroll down to load more job listings. Click "Load more" button if it appears to reveal more jobs.

For each job listing visible, extract:
- title: the job title text
- company: the company name
- location: the location text (e.g. "Jakarta", "Remote", "Bandung")
- url: the full URL to the job detail page

Return a JSON object with a "jobs" key containing an array of all extracted jobs.
Each job should have: title, company, location, url.

Example: {{"jobs": [{{"title": "Frontend Engineer", "company": "Tokopedia", "location": "Jakarta", "url": "https://glints.com/..."}}]}}
"""

    agent = Agent(
        task=task,
        llm=llm,
        demo_mode=True,  # ← This makes the browser VISIBLE with a live action panel
    )

    log.info("Agent created. Starting run — watch your browser window!")
    result = await agent.run()
    log.info("Agent run complete.")

    jobs = []
    if result.output:
        try:
            if isinstance(result.output, str):
                data = json.loads(result.output)
            else:
                data = result.output
            jobs = data.get("jobs", [])[:max_jobs]
        except (json.JSONDecodeError, KeyError) as e:
            log.error("Error parsing output: %s", e)
            log.error("Raw output: %s", result.output)

    return {
        "keyword": keyword,
        "platform": "glints",
        "jobs": jobs,
        "jobs_count": len(jobs),
        "log_file": str(LOG_FILE),
    }


# ── CLI entry point ───────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="Glints scraper agent with visible browser"
    )
    parser.add_argument("--keyword", default="frontend engineer")
    parser.add_argument("--max-jobs", type=int, default=50)
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("Glints Agent starting — DEMO MODE (visible browser)")
    log.info("Log file: %s", LOG_FILE)
    log.info("=" * 60)

    result = asyncio.run(run_agent(args.keyword, args.max_jobs))

    log.info("Extracted %d jobs", result["jobs_count"])
    log.info("Jobs:\n%s", json.dumps(result["jobs"], indent=2))

    print("\n--- RESULT ---")
    print(json.dumps(result, indent=2))
    print(f"\nFull log written to: {LOG_FILE}")


if __name__ == "__main__":
    main()
