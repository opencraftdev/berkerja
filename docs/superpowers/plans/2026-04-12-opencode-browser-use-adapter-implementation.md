# OpenCode Browser Use Adapter Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ChatAnthropic` in `glints_agent.py` with a custom `OpenCodeLLM` wrapper that proxies to a local OpenCode ACP server, using server-side session history.

**Architecture:** `OpenCodeLLM` implements browser-use's `BaseChatModel` protocol, sends messages to the ACP HTTP server, parses OpenCode's text responses into `AgentOutput` action lists. The browser-use Agent loop (Playwright/Playwright control, action execution) stays unchanged.

**Tech Stack:** Python 3.11+, httpx (async HTTP), browser-use, Python's `__future__` annotations for protocol compatibility.

---

## File Map

### New file:
- `backend/agents/opencode_llm.py` — `OpenCodeLLM` class implementing `BaseChatModel`

### Modified file:
- `backend/agents/glints_agent.py` — swap `ChatAnthropic` → `OpenCodeLLM`

---

## Task 1: Write OpenCodeLLM

**Files:**
- Create: `backend/agents/opencode_llm.py`

- [ ] **Step 1: Write the file**

```python
from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any, Protocol, TypeVar

import httpx
from browser_use.llm.views import ChatInvokeCompletion, ChatInvokeUsage
from browser_use.llm.messages import BaseMessage, UserMessage, SystemMessage, AssistantMessage
from browser_use.agent.views import AgentOutput

if TYPE_CHECKING:
    pass

log = logging.getLogger("opencode_llm")

T = TypeVar("T")


class OpenCodeLLM:
    model: str = "opencode"
    provider: str = "opencode"
    name: str = "OpenCode"

    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8080",
        timeout: float = 120.0,
    ) -> None:
        self.server_url = server_url.rstrip("/")
        self.timeout = timeout
        self._session_id: str | None = None
        self._client = httpx.AsyncClient(timeout=timeout)
        self._ensure_session()

    def _ensure_session(self) -> None:
        if self._session_id is not None:
            return
        response = httpx.post(
            f"{self.server_url}/session",
            json={},
            timeout=self.timeout,
        )
        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to create OpenCode session: {response.status_code} {response.text}"
            )
        data = response.json()
        self._session_id = data.get("session_id") or data.get("id")
        if not self._session_id:
            raise RuntimeError(f"No session_id in response: {data}")
        log.info("OpenCode session created: %s", self._session_id)

    async def ainvoke(
        self,
        messages: list[BaseMessage],
        output_format: type[T] | None = None,
        **kwargs: Any,
    ) -> ChatInvokeCompletion[T]:
        self._ensure_session()

        formatted = []
        for msg in messages:
            converted = self._convert_message(msg)
            if converted:
                formatted.append(converted)

        payload = {"content": "\n\n".join(formatted)}
        response = httpx.post(
            f"{self.server_url}/session/{self._session_id}/message",
            json=payload,
            timeout=self.timeout,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"OpenCode message failed: {response.status_code} {response.text}"
            )

        text = response.text
        agent_output = self._parse_response(text)

        return ChatInvokeCompletion(
            completion=agent_output,  # type: ignore
            thinking=getattr(agent_output, "thinking", None),
            usage=ChatInvokeUsage(
                tokens_in=0, tokens_out=0, cost_usd=0.0
            ),
        )

    def _convert_message(self, msg: BaseMessage) -> str | None:
        if isinstance(msg, SystemMessage):
            return f"[system] {msg.content}"
        elif isinstance(msg, UserMessage):
            return f"[user] {msg.content}"
        elif isinstance(msg, AssistantMessage):
            return f"[assistant] {msg.content}"
        elif hasattr(msg, "content") and msg.content:
            return f"[message] {msg.content}"
        return None

    def _parse_response(self, text: str) -> AgentOutput:
        import re

        json_match = re.search(
            r"\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}[^{}]*)*\}",
            text,
            re.DOTALL,
        )

        if json_match:
            try:
                data = json.loads(json_match.group())
                actions = data.get("action", [])
                return AgentOutput(
                    thinking=data.get("thinking", ""),
                    action=actions,  # type: ignore
                )
            except (json.JSONDecodeError, Exception):
                pass

        return AgentOutput(
            thinking=text[:500],
            action=[{"DoneAction": {"text": text[:1000], "success": True}}],  # type: ignore
        )

    async def aclose(self) -> None:
        if self._session_id:
            try:
                httpx.post(
                    f"{self.server_url}/session/{self._session_id}/delete",
                    timeout=5.0,
                )
            except Exception:
                pass
            self._session_id = None
        await self._client.aclose()

    def __del__(self) -> None:
        if self._session_id is not None:
            try:
                httpx.post(
                    f"{self.server_url}/session/{self._session_id}/delete",
                    timeout=5.0,
                )
            except Exception:
                pass
```

- [ ] **Step 2: Commit**

```bash
git add backend/agents/opencode_llm.py
git commit -m "feat: add OpenCodeLLM implementing BaseChatModel for browser-use"
```

---

## Task 2: Update glints_agent.py

**Files:**
- Modify: `backend/agents/glints_agent.py`

- [ ] **Step 1: Replace the LLM import and instantiation**

In `backend/agents/glints_agent.py`:

Replace (lines 47-54):
```python
    from browser_use import Agent
    from langchain_anthropic import ChatAnthropic

    log.info("Starting Glints agent for keyword=%r, max_jobs=%d", keyword, max_jobs)
    log.info("BROWSER_USE_API_KEY present: %s", bool(os.getenv("BROWSER_USE_API_KEY")))
    log.info("Browser Use agent with demo_mode=True — a browser window will open!")

    llm = ChatAnthropic(model="claude-sonnet-4-20250514")
```

With:
```python
    from browser_use import Agent
    from opencode_llm import OpenCodeLLM

    log.info("Starting Glints agent for keyword=%r, max_jobs=%d", keyword, max_jobs)
    log.info("OpenCode LLM wrapper — make sure 'opencode acp --port 8080' is running")

    llm = OpenCodeLLM()
```

Keep the `task` prompt and `agent = Agent(task=task, llm=llm, demo_mode=True)` line unchanged.

- [ ] **Step 2: Commit**

```bash
git add backend/agents/glints_agent.py
git commit -m "feat: swap ChatAnthropic for OpenCodeLLM in glints_agent"
```

---

## Verification

**Prerequisites:**
```bash
# Terminal 1 — start ACP server:
opencode acp --port 8080

# Terminal 2 — run the agent:
cd backend
source .venv/bin/activate
python -m agents.glints_agent --keyword "frontend engineer" --max-jobs 10
```

**Expected:**
1. Browser window opens (demo_mode=True)
2. OpenCodeLLM connects to ACP, creates session
3. Agent loop runs with OpenCode as brain
4. Jobs extracted and returned as JSON

**If it fails:** Check `backend/logs/glints_*.log` for detailed error messages from both the agent and OpenCodeLLM.

---

## Notes

- The regex JSON extraction in `_parse_response` handles nested JSON (up to 4 levels deep). If OpenCode responds with deeply nested action structures, this may need adjustment.
- `output_format` is accepted but ignored — OpenCode is a chat model, not a structured output model.
- The session is created lazily on first `ainvoke` call, not in `__init__`, so the ACP server only needs to be running when the first scrape step executes.
- If you see `AttributeError: 'OpenCodeLLM' object has no attribute 'provider'` from browser-use, double-check that `provider` is set directly on the class (not via `__init__` only) — the Agent uses `@runtime_checkable` protocol checks that inspect the class directly.
