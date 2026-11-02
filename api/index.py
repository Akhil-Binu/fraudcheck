"""Vercel Serverless Function entry point for FraudCheck API."""

from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app

# Vercel looks for the ASGI app object named `app`
__all__ = ["app"]
