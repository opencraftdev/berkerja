from collections.abc import Sequence
import inspect
import json

from job_automation.models import JobListing


def build_glints_task(keyword: str) -> str:
    return (
        "Open Glints job search in a visible browser, search for the keyword "
        f"'{keyword}', then extract job listings into JSON-ready records with these "
        "fields only: title, company, location, url, salary, posted_date. "
        "Return an array of objects."
    )


def build_browser(browser_factory=None):
    if browser_factory is None:
        from browser_use import Browser

        browser_factory = Browser
    return browser_factory(headless=False)


def build_agent(task: str, llm, browser, agent_factory=None):
    if agent_factory is None:
        from browser_use import Agent

        agent_factory = Agent
    return agent_factory(task=task, llm=llm, browser=browser)


class GlintsScraper:
    def __init__(self, llm, browser_factory=None, agent_factory=None) -> None:
        self.llm = llm
        self.browser_factory = browser_factory or build_browser
        self.agent_factory = agent_factory or build_agent

    async def scrape(self, keyword: str) -> Sequence[JobListing]:
        browser = self.browser_factory()
        try:
            agent = self.agent_factory(build_glints_task(keyword), self.llm, browser)
        except Exception:
            await self._cleanup_browser(browser)
            raise
        history = await agent.run()
        raw_results = history.final_result()
        if not raw_results:
            raise ValueError("Glints agent did not return any final result")
        return [JobListing(**item) for item in json.loads(raw_results)]

    async def _cleanup_browser(self, browser) -> None:
        close = getattr(browser, "close", None) or getattr(browser, "aclose", None)
        if close is None:
            return

        result = close()
        if inspect.isawaitable(result):
            await result
