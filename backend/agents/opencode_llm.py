from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING, Any, TypeVar

import httpx

from browser_use.llm.views import ChatInvokeCompletion, ChatInvokeUsage
from browser_use.llm.messages import (
    BaseMessage,
    UserMessage,
    SystemMessage,
    AssistantMessage,
)
from browser_use.agent.views import AgentOutput

logger = logging.getLogger(__name__)

T = TypeVar("T")


class OpenCodeLLM:
    model: str = "opencode"
    provider: str = "opencode"
    name: str = "OpenCode"

    def __init__(
        self, server_url: str = "http://127.0.0.1:8080", timeout: float = 120.0
    ):
        self.server_url = server_url
        self.timeout = timeout
        self._session_id: str | None = None
        self._client = httpx.AsyncClient(timeout=timeout)
        self._ensure_session()

    def _ensure_session(self) -> None:
        response = httpx.post(f"{self.server_url}/session", json={})
        if response.status_code == 200:
            self._session_id = response.json().get("session_id")
            if not self._session_id:
                raise RuntimeError("No session_id in response")
        else:
            raise RuntimeError(f"Failed to create session: {response.status_code}")

    async def ainvoke(
        self,
        messages: list[BaseMessage],
        output_format: type[T] | None = None,
        **kwargs,
    ) -> ChatInvokeCompletion[AgentOutput]:
        formatted_parts = []
        for msg in messages:
            converted = self._convert_message(msg)
            if converted is not None:
                formatted_parts.append(converted)

        formatted_body = "\n\n".join(formatted_parts)

        response = await self._client.post(
            f"{self.server_url}/session/{self._session_id}/message",
            json={"content": formatted_body},
        )
        response.raise_for_status()
        text = response.text

        agent_output = self._parse_response(text)

        return ChatInvokeCompletion(
            completion=agent_output,
            thinking=agent_output.thinking,
            usage=ChatInvokeUsage(tokens_in=0, tokens_out=0, cost_usd=0.0),
        )

    def _convert_message(self, msg: BaseMessage) -> str | None:
        content = getattr(msg, "content", None)
        if content is None:
            return None

        if isinstance(msg, SystemMessage):
            return f"[system] {content}"
        elif isinstance(msg, UserMessage):
            return f"[user] {content}"
        elif isinstance(msg, AssistantMessage):
            return f"[assistant] {content}"
        else:
            return f"[message] {content}"

    def _parse_response(self, text: str) -> AgentOutput:
        json_match = re.search(
            r"\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}[^{}]*)*\}",
            text,
            re.DOTALL,
        )

        if json_match:
            try:
                data = json.loads(json_match.group(0))
                thinking = data.get("thinking", "")
                action = data.get("action", {})
                return AgentOutput(
                    thinking=thinking,
                    evaluation_previous_goal="",
                    memory="",
                    next_goal="",
                    current_plan_item="",
                    plan_update="",
                    action=[action] if action else [],
                )
            except json.JSONDecodeError:
                pass

        return AgentOutput(
            thinking=text[:500],
            evaluation_previous_goal="",
            memory="",
            next_goal="",
            current_plan_item="",
            plan_update="",
            action=[{"DoneAction": {"text": text[:1000], "success": True}}],
        )

    async def aclose(self) -> None:
        if self._session_id:
            try:
                await self._client.delete(
                    f"{self.server_url}/session/{self._session_id}/delete",
                )
            except Exception:
                pass
            finally:
                await self._client.aclose()
                self._session_id = None

    def __del__(self) -> None:
        if self._session_id is not None:
            try:
                httpx.post(f"{self.server_url}/session/{self._session_id}/delete")
            except Exception:
                pass
