from __future__ import annotations

import json
from typing import Any, TypeVar

import httpx
from browser_use.llm.messages import BaseMessage
from browser_use.llm.views import ChatInvokeCompletion, ChatInvokeUsage
from pydantic import TypeAdapter
from pydantic import ValidationError as PydanticValidationError


T = TypeVar("T")


class OpenCodeLLM:
    """Minimal async LLM wrapper kept intentionally small for browser-use integration."""

    def __init__(
        self,
        acp_url: str,
        model: str,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.acp_url = acp_url
        self.model = model
        self._client = client or httpx.AsyncClient(timeout=60.0)
        self._verified_api_keys = True

    @property
    def provider(self) -> str:
        return "opencode"

    @property
    def name(self) -> str:
        return "OpenCode"

    @property
    def model_name(self) -> str:
        return self.model

    def _message_to_text(self, message: BaseMessage) -> str:
        content = getattr(message, "content", "")
        if isinstance(content, str):
            return content
        if not isinstance(content, list):
            return str(content)

        parts: list[str] = []
        for part in content:
            if hasattr(part, "model_dump"):
                part = part.model_dump()

            if isinstance(part, dict):
                if part.get("type") == "text":
                    parts.append(str(part.get("text", "")))
                    continue

                part_type = part.get("type")
                if part_type:
                    parts.append(f"[{part_type} content omitted]")
                    continue

            parts.append(str(part))
        return "\n".join(part for part in parts if part)

    def _message_to_prompt_line(self, message: BaseMessage) -> str:
        text = self._message_to_text(message)
        if not text:
            return ""

        role = getattr(
            message, "role", message.__class__.__name__.removesuffix("Message")
        )
        return f"[{role}] {text}"

    def _parse_structured_output(self, completion: str, output_format: type[T]) -> T:
        try:
            data = json.loads(completion)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"OpenCodeLLM could not parse ACP response as JSON for output_format {output_format}: {exc.msg}"
            ) from exc

        try:
            return TypeAdapter(output_format).validate_python(data)
        except PydanticValidationError as exc:
            raise ValueError(
                f"OpenCodeLLM ACP response did not match output_format {output_format}: {exc}"
            ) from exc

    async def _apost_prompt(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "input": prompt,
        }
        response = await self._client.post(
            self.acp_url,
            content=json.dumps(payload, separators=(",", ":")),
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        body = response.json()
        output = body.get("output", {})
        text = output.get("text", "")
        return str(text).strip()

    async def ainvoke(
        self,
        messages: list[BaseMessage],
        output_format: type[T] | None = None,
        **kwargs: Any,
    ) -> ChatInvokeCompletion[T] | ChatInvokeCompletion[str]:
        del kwargs
        prompt = "\n\n".join(
            text
            for text in (self._message_to_prompt_line(message) for message in messages)
            if text
        )
        completion = await self._apost_prompt(prompt)
        parsed_completion = (
            self._parse_structured_output(completion, output_format)
            if output_format is not None
            else completion
        )
        usage = ChatInvokeUsage(
            prompt_tokens=0,
            prompt_cached_tokens=None,
            prompt_cache_creation_tokens=None,
            prompt_image_tokens=None,
            completion_tokens=0,
            total_tokens=0,
        )
        return ChatInvokeCompletion(
            completion=parsed_completion, thinking=None, usage=usage
        )

    async def __call__(self, prompt: str) -> str:
        return await self._apost_prompt(prompt)

    async def aclose(self) -> None:
        await self._client.aclose()
