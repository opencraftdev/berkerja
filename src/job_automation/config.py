import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    opencode_acp_url: str
    opencode_model: str
    default_output_path: str
    headless: bool

    @classmethod
    def from_env(cls) -> "Settings":
        load_dotenv()

        opencode_acp_url = os.getenv("OPENCODE_ACP_URL", "").strip()
        if not opencode_acp_url:
            raise ValueError("OPENCODE_ACP_URL is required")

        return cls(
            opencode_acp_url=opencode_acp_url,
            opencode_model=os.getenv("OPENCODE_MODEL", "MiniMax-M2.7-highspeed").strip()
            or "MiniMax-M2.7-highspeed",
            default_output_path=os.getenv(
                "JOB_AUTOMATION_OUTPUT", "output/glints-jobs.json"
            ).strip()
            or "output/glints-jobs.json",
            headless=False,
        )
