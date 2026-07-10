import json
import logging

from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.logging_config import configure_app_logging
from app.routers import events


def test_analytics_event_reaches_stdout_through_the_real_route(capsys):
    app_logger = logging.getLogger("app")
    app_logger.handlers.clear()
    events.limiter.reset()
    try:
        configure_app_logging()

        app = FastAPI()
        app.state.limiter = events.limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        app.include_router(events.router)

        with TestClient(app) as client:
            resp = client.post(
                "/api/event",
                json={
                    "event": "play",
                    "props": {"marker": "__logging_regression_test__"},
                    "path": "/listen",
                },
            )
        assert resp.status_code == 200

        lines = [line for line in capsys.readouterr().out.splitlines() if line.strip()]
        assert len(lines) == 1
        payload = json.loads(lines[0])
        assert payload["type"] == "analytics_event"
        assert payload["event"] == "play"
        assert payload["props"]["marker"] == "__logging_regression_test__"
    finally:
        app_logger.handlers.clear()
        events.limiter.reset()
