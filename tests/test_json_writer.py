import json
from pathlib import Path
from typing import Optional

from job_automation.models import JobListing
from job_automation.output.json_writer import write_job_listings


def test_write_job_listings_persists_flat_json_array(tmp_path) -> None:
    output_path = tmp_path / "jobs.json"

    write_job_listings(
        output_path,
        [
            JobListing(
                title="Frontend Developer",
                company="Glints",
                location="Jakarta",
                url="https://example.com/jobs/1",
                salary="",
                posted_date="2 days ago",
            )
        ],
    )

    payload = json.loads(output_path.read_text())
    assert payload == [
        {
            "title": "Frontend Developer",
            "company": "Glints",
            "location": "Jakarta",
            "url": "https://example.com/jobs/1",
            "salary": "",
            "posted_date": "2 days ago",
        }
    ]


def test_write_job_listings_writes_utf8_json(monkeypatch, tmp_path) -> None:
    captured: dict[str, object] = {}

    def fake_write_text(
        self: Path, data: str, encoding: Optional[str] = None, **kwargs
    ) -> int:
        captured["path"] = self
        captured["data"] = data
        captured["encoding"] = encoding
        return len(data)

    monkeypatch.setattr(Path, "write_text", fake_write_text)

    output_path = tmp_path / "jobs.json"

    write_job_listings(
        output_path,
        [
            JobListing(
                title="Ingénieur",
                company="München Jobs",
                location="München",
                url="https://example.com/jobs/2",
                salary="Rp 20.000.000",
                posted_date="hari ini",
            )
        ],
    )

    assert captured["path"] == output_path
    assert captured["encoding"] == "utf-8"
    assert "München" in captured["data"]
