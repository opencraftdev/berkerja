import httpx
import pytest
from browser_use.llm.messages import AssistantMessage, SystemMessage, UserMessage
from browser_use.llm.views import ChatInvokeCompletion
from pydantic import BaseModel

from job_automation.llm.opencode import OpenCodeLLM


class JobSummary(BaseModel):
    status: str
    count: int


@pytest.mark.asyncio
async def test_ainvoke_posts_messages_to_acp_endpoint() -> None:
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["json"] = request.read().decode("utf-8")
        return httpx.Response(200, json={"output": {"text": "scrape complete"}})

    transport = httpx.MockTransport(handler)
    llm = OpenCodeLLM(
        acp_url="http://127.0.0.1:4096/acp",
        model="MiniMax-M2.7-highspeed",
        client=httpx.AsyncClient(transport=transport),
    )

    result = await llm.ainvoke(
        [
            SystemMessage(content="You are helpful."),
            UserMessage(content="Collect jobs"),
        ]
    )

    assert llm.provider == "opencode"
    assert llm.name == "OpenCode"
    assert llm.model == "MiniMax-M2.7-highspeed"
    assert llm.model_name == "MiniMax-M2.7-highspeed"
    assert isinstance(result, ChatInvokeCompletion)
    assert result.completion == "scrape complete"
    assert result.thinking is None
    assert result.usage is not None
    assert captured["url"] == "http://127.0.0.1:4096/acp"
    assert '"model":"MiniMax-M2.7-highspeed"' in captured["json"]
    assert (
        '"input":"[system] You are helpful.\\n\\n[user] Collect jobs"'
        in captured["json"]
    )


@pytest.mark.asyncio
async def test_ainvoke_preserves_message_roles_in_acp_prompt() -> None:
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = request.read().decode("utf-8")
        return httpx.Response(200, json={"output": {"text": "ok"}})

    llm = OpenCodeLLM(
        acp_url="http://127.0.0.1:4096/acp",
        model="MiniMax-M2.7-highspeed",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await llm.ainvoke(
        [
            SystemMessage(content="You are helpful."),
            UserMessage(content="Collect jobs"),
            AssistantMessage(content="I can help with that."),
        ]
    )

    assert (
        '"input":"[system] You are helpful.\\n\\n[user] Collect jobs\\n\\n[assistant] I can help with that."'
        in captured["json"]
    )


@pytest.mark.asyncio
async def test_ainvoke_parses_structured_output_when_requested() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"output": {"text": '{"status":"ok","count":2}'}}
        )

    llm = OpenCodeLLM(
        acp_url="http://127.0.0.1:4096/acp",
        model="MiniMax-M2.7-highspeed",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await llm.ainvoke(
        [UserMessage(content="Collect jobs")], output_format=JobSummary
    )

    assert isinstance(result.completion, JobSummary)
    assert result.completion.status == "ok"
    assert result.completion.count == 2


@pytest.mark.asyncio
async def test_ainvoke_raises_clear_error_for_invalid_structured_output() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"output": {"text": "not json"}})

    llm = OpenCodeLLM(
        acp_url="http://127.0.0.1:4096/acp",
        model="MiniMax-M2.7-highspeed",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(ValueError, match="output_format"):
        await llm.ainvoke(
            [UserMessage(content="Collect jobs")], output_format=JobSummary
        )


def test_message_to_text_preserves_non_text_content_parts() -> None:
    llm = OpenCodeLLM(acp_url="http://127.0.0.1:4096/acp", model="MiniMax-M2.7-highspeed")

    text = llm._message_to_text(
        UserMessage(
            content=[
                {"type": "text", "text": "Analyze this page"},
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/image.png"},
                },
            ]
        )
    )

    assert text == "Analyze this page\n[image_url content omitted]"


def test_opencode_llm_exposes_browser_use_facing_protocol_fields() -> None:
    llm = OpenCodeLLM(acp_url="http://127.0.0.1:4096/acp", model="MiniMax-M2.7-highspeed")

    assert callable(llm.ainvoke)
    assert callable(llm.__call__)
    assert llm._verified_api_keys is True
