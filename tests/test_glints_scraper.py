import json
import subprocess
import sys
from pathlib import Path

from job_automation.scrapers.glints import build_glints_task

import pytest

from job_automation.models import JobListing
from job_automation.scrapers.glints import GlintsScraper


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def test_build_glints_task_includes_runtime_keyword() -> None:
    task = build_glints_task("frontend developer")

    assert "frontend developer" in task
    assert "Glints" in task
    assert "title" in task
    assert "posted_date" in task


def test_glints_module_import_does_not_require_browser_use() -> None:
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

from job_automation.scrapers.glints import GlintsScraper, build_glints_task

assert GlintsScraper is not None
assert "Glints" in build_glints_task("frontend developer")
"""

    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )

    assert result.returncode == 0, result.stderr


class FakeAgentHistoryList:
    def __init__(self, result: str) -> None:
        self._result = result

    def final_result(self) -> str:
        return self._result


class FakeAgent:
    def __init__(self, task: str, llm, browser) -> None:
        self.task = task
        self.llm = llm
        self.browser = browser

    async def run(self) -> FakeAgentHistoryList:
        return FakeAgentHistoryList(
            json.dumps(
                [
                    {
                        "title": "Frontend Developer",
                        "company": "Glints",
                        "location": "Jakarta",
                        "url": "https://example.com/jobs/1",
                        "salary": "",
                        "posted_date": "2 days ago",
                    }
                ]
            )
        )


class FakeBrowser:
    pass


@pytest.mark.asyncio
async def test_glints_scraper_normalizes_agent_results() -> None:
    llm = object()
    created_browser = FakeBrowser()
    created_agent: FakeAgent | None = None
    browser_factory_calls = 0
    agent_factory_calls = 0

    def browser_factory() -> FakeBrowser:
        nonlocal browser_factory_calls
        browser_factory_calls += 1
        return created_browser

    def agent_factory(task: str, llm, browser) -> FakeAgent:
        nonlocal created_agent
        nonlocal agent_factory_calls
        agent_factory_calls += 1
        created_agent = FakeAgent(task, llm, browser)
        return created_agent

    scraper = GlintsScraper(
        llm=llm,
        browser_factory=browser_factory,
        agent_factory=agent_factory,
    )

    listings = await scraper.scrape("frontend developer")

    assert browser_factory_calls == 1
    assert agent_factory_calls == 1
    assert created_agent is not None
    assert "frontend developer" in created_agent.task
    assert created_agent.llm is llm
    assert created_agent.browser is created_browser
    assert listings == [
        JobListing(
            title="Frontend Developer",
            company="Glints",
            location="Jakarta",
            url="https://example.com/jobs/1",
            salary="",
            posted_date="2 days ago",
        )
    ]


@pytest.mark.asyncio
async def test_glints_scraper_cleans_up_browser_when_agent_creation_fails() -> None:
    llm = object()

    class ClosableBrowser:
        def __init__(self) -> None:
            self.close_calls = 0

        async def close(self) -> None:
            self.close_calls += 1

    created_browser = ClosableBrowser()

    def browser_factory() -> ClosableBrowser:
        return created_browser

    def agent_factory(task: str, llm, browser) -> FakeAgent:
        raise RuntimeError("agent factory failed")

    scraper = GlintsScraper(
        llm=llm,
        browser_factory=browser_factory,
        agent_factory=agent_factory,
    )

    with pytest.raises(RuntimeError, match="agent factory failed"):
        await scraper.scrape("frontend developer")

    assert created_browser.close_calls == 1


@pytest.mark.asyncio
async def test_glints_scraper_raises_when_agent_returns_no_final_result() -> None:
    llm = object()

    class EmptyHistory:
        def final_result(self) -> str:
            return ""

    class EmptyResultAgent:
        async def run(self) -> EmptyHistory:
            return EmptyHistory()

    scraper = GlintsScraper(
        llm=llm,
        browser_factory=FakeBrowser,
        agent_factory=lambda task, llm, browser: EmptyResultAgent(),
    )

    with pytest.raises(ValueError, match="did not return any final result"):
        await scraper.scrape("frontend developer")
