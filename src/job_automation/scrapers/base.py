from collections.abc import Sequence
from typing import Protocol

from job_automation.models import JobListing


class Scraper(Protocol):
    async def scrape(self, keyword: str) -> Sequence[JobListing]: ...
