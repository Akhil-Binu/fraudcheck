"""Vercel Serverless Function entry point for FraudCheck API."""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlencode

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("vercel_asgi")

# Add backend and root directories to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app as fastapi_app


class VercelPathFixMiddleware:
    """Restores the actual API request path when invoked behind Vercel rewrites."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            query_string = scope.get("query_string", b"").decode("utf-8", errors="ignore")
            params = parse_qs(query_string, keep_blank_values=True)

            if "path" in params and params["path"]:
                target = params["path"][0].strip("/")
                scope["path"] = f"/api/{target}"
                del params["path"]
                # Rebuild query string without the router's internal 'path' parameter
                clean_qs = urlencode([(k, v) for k, vals in params.items() for v in vals])
                scope["query_string"] = clean_qs.encode("utf-8")
            else:
                for header_name, header_val in scope.get("headers", []):
                    if header_name.lower() == b"x-matched-path":
                        matched = header_val.decode("utf-8", errors="ignore")
                        if matched.startswith("/api"):
                            scope["path"] = matched
                        break

            logger.info("Vercel ASGI dispatching path: %s", scope.get("path"))

        await self.app(scope, receive, send)


app = VercelPathFixMiddleware(fastapi_app)
__all__ = ["app"]
