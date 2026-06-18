import os

import boto3
from botocore.client import Config

_ENDPOINT = os.getenv("B2_ENDPOINT_URL", "https://s3.us-east-005.backblazeb2.com")
_KEY_ID = os.getenv("B2_KEY_ID")
_APP_KEY = os.getenv("B2_APPLICATION_KEY")
_BUCKET = os.getenv("B2_BUCKET_NAME")
MEDIA_BASE_URL = os.getenv("MEDIA_BASE_URL", "")


def _client():
    return boto3.client(
        "s3",
        endpoint_url=_ENDPOINT,
        aws_access_key_id=_KEY_ID,
        aws_secret_access_key=_APP_KEY,
        config=Config(signature_version="s3v4"),
    )


def upload_file(data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    _client().put_object(Bucket=_BUCKET, Key=key, Body=data, ContentType=content_type)
    return key


def delete_file(key: str):
    if not key:
        return
    if key.startswith("/uploads/"):
        key = key[len("/uploads/"):]
    try:
        _client().delete_object(Bucket=_BUCKET, Key=key)
    except Exception:
        pass


def media_url(key: str | None) -> str | None:
    if not key:
        return None
    if key.startswith("http"):
        return key
    if key.startswith("/uploads/"):
        key = key[len("/uploads/"):]
    return f"{MEDIA_BASE_URL}/{key}"
