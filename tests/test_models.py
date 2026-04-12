import pytest
from pydantic import ValidationError

from job_automation.models import JobListing


def test_job_listing_normalizes_missing_text_fields() -> None:
    listing = JobListing(
        title="Frontend Developer",
        company="Glints",
        location=None,
        url="https://example.com/jobs/1",
        salary=None,
        posted_date=None,
    )

    assert listing.location == ""
    assert listing.salary == ""
    assert listing.posted_date == ""


def test_job_listing_rejects_structured_text_values() -> None:
    with pytest.raises(ValidationError):
        JobListing(title={"label": "Frontend Developer"})
