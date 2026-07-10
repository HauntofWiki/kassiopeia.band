import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.routers import events

LOGGER_NAME = "app.routers.events"


@pytest.fixture
def client():
    events.limiter.reset()
    app = FastAPI()
    app.state.limiter = events.limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(events.router)
    with TestClient(app) as c:
        yield c
    events.limiter.reset()


def test_valid_event_logs_structured_json(client, caplog):
    with caplog.at_level("INFO", logger=LOGGER_NAME):
        resp = client.post(
            "/api/event",
            json={"event": "play", "props": {"track_id": 42}, "path": "/listen"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    records = [r for r in caplog.records if r.name == LOGGER_NAME]
    assert len(records) == 1
    payload = json.loads(records[0].getMessage())
    assert payload["event"] == "play"
    assert payload["props"] == {"track_id": 42}
    assert payload["path"] == "/listen"
    assert "timestamp" in payload


def test_event_defaults_props_and_path(client, caplog):
    with caplog.at_level("INFO", logger=LOGGER_NAME):
        client.post("/api/event", json={"event": "pageview"})
    records = [r for r in caplog.records if r.name == LOGGER_NAME]
    payload = json.loads(records[-1].getMessage())
    assert payload["props"] == {}
    assert payload["path"] is None


def test_missing_event_rejected(client):
    resp = client.post("/api/event", json={"props": {}})
    assert resp.status_code == 422


def test_oversized_event_name_rejected(client):
    resp = client.post("/api/event", json={"event": "x" * 500})
    assert resp.status_code == 422


def test_too_many_props_keys_rejected(client):
    props = {f"k{i}": i for i in range(50)}
    resp = client.post("/api/event", json={"event": "play", "props": props})
    assert resp.status_code == 422


def test_oversized_props_payload_rejected(client):
    props = {"blob": "x" * 10_000}
    resp = client.post("/api/event", json={"event": "play", "props": props})
    assert resp.status_code == 422


def test_rate_limit_kicks_in(client):
    for _ in range(60):
        resp = client.post("/api/event", json={"event": "play"})
        assert resp.status_code == 200
    resp = client.post("/api/event", json={"event": "play"})
    assert resp.status_code == 429
