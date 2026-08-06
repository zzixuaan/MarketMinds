from fastapi.testclient import TestClient
from fastapi import HTTPException
from unittest.mock import MagicMock

from main import app
import routes.portfolio as portfolio

client = TestClient(app)


def test_get_portfolio_missing_token():
    response = client.get("/api/portfolio")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing token"


def test_get_portfolio_history_missing_token():
    response = client.get("/api/portfolio/history")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing token"


def test_get_portfolio_invalid_token(monkeypatch):

    def fake_verify_token(token):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    monkeypatch.setattr(
        portfolio,
        "verify_token",
        fake_verify_token,
    )

    response = client.get(
        "/api/portfolio",
        headers={
            "Authorization": "Bearer badtoken"
        },
    )

    assert response.status_code == 401


def test_get_portfolio_history_invalid_token(monkeypatch):

    def fake_verify_token(token):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    monkeypatch.setattr(
        portfolio,
        "verify_token",
        fake_verify_token,
    )

    response = client.get(
        "/api/portfolio/history",
        headers={
            "Authorization": "Bearer badtoken"
        },
    )

    assert response.status_code == 401


def test_get_portfolio_user_not_found(monkeypatch):

    monkeypatch.setattr(
        portfolio,
        "verify_token",
        lambda token: {"uid": "test-user"},
    )

    fake_doc = MagicMock()
    fake_doc.exists = False

    fake_user = MagicMock()
    fake_user.get.return_value = fake_doc

    fake_db = MagicMock()
    fake_db.collection.return_value.document.return_value = fake_user

    monkeypatch.setattr(
        portfolio,
        "db",
        fake_db,
    )

    response = client.get(
        "/api/portfolio",
        headers={
            "Authorization": "Bearer validtoken"
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"