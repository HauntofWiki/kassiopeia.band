import logging
import sys


def configure_app_logging() -> None:
    # Root logger defaults to WARNING with no handlers, which silently drops
    # INFO-level logs (e.g. analytics_event) before they reach stdout/Promtail.
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    if not app_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(message)s"))
        app_logger.addHandler(handler)
