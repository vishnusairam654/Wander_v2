import pytest
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_cors_headers():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://wanderway-taupe.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://wanderway-taupe.vercel.app"
