from __future__ import annotations

import argparse
import asyncio
from typing import TYPE_CHECKING, Any

from job_automation.config import Settings
from job_automation.output.json_writer import write_job_listings

if TYPE_CHECKING:
    from job_automation.llm.opencode import OpenCodeLLM


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="job-automation")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scrape_glints = subparsers.add_parser("scrape-glints")
    scrape_glints.add_argument("--keyword", required=True)
    scrape_glints.add_argument("--output")

    return parser


def build_llm(settings: Settings) -> "OpenCodeLLM":
    from job_automation.llm.opencode import OpenCodeLLM

    return OpenCodeLLM(acp_url=settings.opencode_acp_url, model=settings.opencode_model)


def build_scraper(llm: Any):
    from job_automation.scrapers.glints import GlintsScraper

    return GlintsScraper(llm)


async def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    settings = Settings.from_env()

    if args.command != "scrape-glints":
        return 1

    llm = build_llm(settings)
    try:
        scraper = build_scraper(llm)
        listings = await scraper.scrape(args.keyword)
        output_path = args.output or settings.default_output_path
        write_job_listings(output_path, listings)
    finally:
        close = getattr(llm, "aclose", None)
        if close is not None:
            await close()

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
