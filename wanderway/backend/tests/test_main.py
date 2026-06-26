import pytest
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_cors_headers():
    response = client.options(
        "/health/",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
