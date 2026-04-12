from __future__ import annotations

from pathlib import Path
from typing import Iterable

from job_automation.models import JobListing
from pydantic import TypeAdapter


LISTINGS_ADAPTER = TypeAdapter(list[JobListing])


def write_job_listings(output_path: str | Path, listings: Iterable[JobListing]) -> Path:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = LISTINGS_ADAPTER.dump_json(list(listings), indent=2).decode("utf-8")
    path.write_text(payload, encoding="utf-8")
    return path
