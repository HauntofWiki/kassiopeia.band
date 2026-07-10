import json
import logging

from app.logging_config import configure_app_logging


def test_configure_app_logging_emits_info_lines_to_stdout(capsys):
    app_logger = logging.getLogger("app")
    app_logger.handlers.clear()
    try:
        configure_app_logging()

        logging.getLogger("app.routers.events").info(
            json.dumps({"type": "analytics_event", "event": "play"})
        )

        out = capsys.readouterr().out.strip()
        assert json.loads(out) == {"type": "analytics_event", "event": "play"}
    finally:
        app_logger.handlers.clear()
