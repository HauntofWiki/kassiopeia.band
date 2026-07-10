import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["events"])

MAX_EVENT_LENGTH = 100
MAX_PATH_LENGTH = 500
MAX_PROPS_KEYS = 20
MAX_PROPS_JSON_BYTES = 4096


class EventRequest(BaseModel):
    event: str = Field(min_length=1, max_length=MAX_EVENT_LENGTH)
    props: dict = Field(default_factory=dict)
    path: Optional[str] = Field(default=None, max_length=MAX_PATH_LENGTH)

    @field_validator("props")
    @classmethod
    def validate_props(cls, v: dict) -> dict:
        if len(v) > MAX_PROPS_KEYS:
            raise ValueError(f"props may have at most {MAX_PROPS_KEYS} keys")
        try:
            serialized = json.dumps(v)
        except (TypeError, ValueError):
            raise ValueError("props must be JSON-serializable")
        if len(serialized) > MAX_PROPS_JSON_BYTES:
            raise ValueError(f"props exceeds {MAX_PROPS_JSON_BYTES} byte limit")
        return v


@router.post("/event")
@limiter.limit("60/minute")
def create_event(request: Request, body: EventRequest):
    logger.info(json.dumps({
        "type": "analytics_event",
        "event": body.event,
        "props": body.props,
        "path": body.path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }))
    return {"ok": True}
