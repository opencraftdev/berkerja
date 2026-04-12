# job-automation

Minimal Python CLI for running a visible Glints scrape with `browser-use` and a local OpenCode ACP model.

## Setup

- Use Python 3.11 or newer.
- Install dependencies with `uv sync`.
- Install browser dependencies with `uv run browser-use install`.
- Copy `.env.example` to `.env` and update the ACP endpoint if needed.
- The default OpenCode model is `MiniMax-M2.7-highspeed`.

## Run

```bash
uv run python -m job_automation.cli scrape-glints --keyword "frontend developer"
```

Use `--output` to override the JSON output path for a single run.

## Notes

- The scraper launches Browser Use with `headless=False` so the browser stays visible.
- Output defaults to `output/glints-jobs.json` unless `--output` is provided.
- Deterministic unit tests cover config, normalization, JSON output, CLI wiring, and scraper orchestration. The live browser flow should still be verified manually.
