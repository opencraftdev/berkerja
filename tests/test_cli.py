import importlib
import subprocess
import sys
import types
from pathlib import Path
import shutil

import pytest

from job_automation.models import JobListing


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def test_package_imports_from_scaffold_source_tree() -> None:
    original_module = sys.modules.get("job_automation")
    fake_module = types.ModuleType("job_automation")
    fake_module.__version__ = "0.1.0"
    sys.modules["job_automation"] = fake_module

    sys.path.insert(0, str(SRC))
    try:
        del sys.modules["job_automation"]
        module = importlib.import_module("job_automation")
    finally:
        sys.path.pop(0)
        if original_module is None:
            sys.modules.pop("job_automation", None)
        else:
            sys.modules["job_automation"] = original_module

    assert module.__version__ == "0.1.0"
    assert (
        Path(module.__file__).resolve()
        == (SRC / "job_automation" / "__init__.py").resolve()
    )


def test_scrape_glints_requires_keyword() -> None:
    from job_automation.cli import build_parser

    parser = build_parser()

    with pytest.raises(SystemExit):
        parser.parse_args(["scrape-glints"])


def test_build_parser_does_not_require_browser_use() -> None:
    script = f"""
import importlib.abc
import sys

sys.path.insert(0, {str(SRC)!r})


class BlockBrowserUse(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname == 'browser_use' or fullname.startswith('browser_use.'):
            raise ModuleNotFoundError(fullname)
        return None


sys.meta_path.insert(0, BlockBrowserUse())

from job_automation.cli import build_parser

parser = build_parser()
assert parser.prog == 'job-automation'
"""

    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )

    assert result.returncode == 0, result.stderr


def test_cli_imports_under_python_39() -> None:
    python39 = (
        shutil.which("python3.9")
        or "/Library/Developer/CommandLineTools/usr/bin/python3"
    )

    if not Path(python39).exists():
        pytest.skip("Python 3.9 interpreter is not available")

    result = subprocess.run(
        [
            python39,
            "-c",
            "import sys; sys.path.insert(0, 'src'); import job_automation.cli",
        ],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )

    assert result.returncode == 0, result.stderr


class StubScraper:
    async def scrape(self, keyword: str):
        assert keyword == "frontend developer"
        return [
            JobListing(
                title="Frontend Developer",
                company="Glints",
                location="Jakarta",
                url="https://example.com/jobs/1",
                salary="",
                posted_date="2 days ago",
            )
        ]


class ClosableLLM:
    def __init__(self) -> None:
        self.closed = False

    async def aclose(self) -> None:
        self.closed = True


@pytest.mark.asyncio
async def test_main_runs_scrape_and_writes_results(tmp_path, monkeypatch) -> None:
    from job_automation.cli import main

    written = {}
    llm = ClosableLLM()

    monkeypatch.setattr(
        "job_automation.cli.Settings.from_env",
        lambda: type(
            "S",
            (),
            {
                "default_output_path": str(tmp_path / "jobs.json"),
                "opencode_acp_url": "http://127.0.0.1:4096/acp",
                "opencode_model": "MiniMax-M2.7-highspeed",
                "headless": False,
            },
        )(),
    )
    monkeypatch.setattr("job_automation.cli.build_llm", lambda settings: llm)
    monkeypatch.setattr("job_automation.cli.build_scraper", lambda llm: StubScraper())
    monkeypatch.setattr(
        "job_automation.cli.write_job_listings",
        lambda path, listings: (
            written.update({"path": str(path), "count": len(listings)}) or path
        ),
    )

    exit_code = await main(["scrape-glints", "--keyword", "frontend developer"])

    assert exit_code == 0
    assert written["count"] == 1
    assert written["path"].endswith("jobs.json")
    assert llm.closed is True


@pytest.mark.asyncio
async def test_main_closes_llm_when_scrape_fails(monkeypatch, tmp_path) -> None:
    from job_automation.cli import main

    llm = ClosableLLM()

    class FailingScraper:
        async def scrape(self, keyword: str):
            assert keyword == "frontend developer"
            raise RuntimeError("scrape failed")

    monkeypatch.setattr(
        "job_automation.cli.Settings.from_env",
        lambda: type(
            "S",
            (),
            {
                "default_output_path": str(tmp_path / "jobs.json"),
                "opencode_acp_url": "http://127.0.0.1:4096/acp",
                "opencode_model": "MiniMax-M2.7-highspeed",
                "headless": False,
            },
        )(),
    )
    monkeypatch.setattr("job_automation.cli.build_llm", lambda settings: llm)
    monkeypatch.setattr(
        "job_automation.cli.build_scraper", lambda llm: FailingScraper()
    )

    with pytest.raises(RuntimeError, match="scrape failed"):
        await main(["scrape-glints", "--keyword", "frontend developer"])

    assert llm.closed is True
