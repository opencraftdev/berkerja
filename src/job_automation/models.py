from pydantic import BaseModel, Field, field_validator


class JobListing(BaseModel):
    title: str = Field(default="")
    company: str = Field(default="")
    location: str = Field(default="")
    url: str = Field(default="")
    salary: str = Field(default="")
    posted_date: str = Field(default="")

    @field_validator(
        "title",
        "company",
        "location",
        "url",
        "salary",
        "posted_date",
        mode="before",
    )
    @classmethod
    def normalize_text(cls, value: object) -> object:
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()
        return value
