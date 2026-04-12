import job_automation.config as config_module
from job_automation.config import Settings


def test_settings_uses_default_model_and_output_path(monkeypatch) -> None:
    monkeypatch.setattr(config_module, "load_dotenv", lambda: None)
    monkeypatch.setenv("OPENCODE_ACP_URL", "http://127.0.0.1:4096/acp")
    monkeypatch.delenv("OPENCODE_MODEL", raising=False)
    monkeypatch.delenv("JOB_AUTOMATION_OUTPUT", raising=False)

    settings = Settings.from_env()

    assert settings.opencode_acp_url == "http://127.0.0.1:4096/acp"
    assert settings.opencode_model == "MiniMax-M2.7-highspeed"
    assert settings.default_output_path == "output/glints-jobs.json"
    assert settings.headless is False
