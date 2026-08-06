from fastapi.testclient import TestClient

from main import app
from auth import get_current_user_id
import routes.team_routes as team_routes

client = TestClient(app)

def setup_function():
    app.dependency_overrides[get_current_user_id] = (lambda: "owner-user-id")

def teardown_function():
    app.dependency_overrides.clear()

def test_create_team(monkeypatch):
    def fake_create_team(user_id: str, name: str):
        return {
            "id": "team1",
            "name": name,
            "ownerId": user_id,
            "members": [user_id],
            "memberNames": {
                user_id: "Owner",
            },
        }

    monkeypatch.setattr(
        team_routes,
        "create_team",
        fake_create_team,
    )

    response = client.post(
        "/api/teams",
        json={"name": "Test Team"},
    )

    assert response.status_code == 200

    data= response.json()

    assert data["id"] == "team1"
    assert data["name"] == "Test Team"
    assert data["ownerId"] == "owner-user-id"
    assert data["members"] == ["owner-user-id"]

def test_create_team_rejects_wrong_body():
    response = client.post(
        "/api/teams",
        json={"teamName": "Wrong Field"},
    )

    assert response.status_code == 422

def test_get_my_teams_success(monkeypatch):
    def fake_get_my_teams(user_id: str):
        return [
            {
                "id": "team1",
                "name": "Test Team",
                "ownerId": user_id,
                "members": [user_id],
                "memberNames": {
                    user_id: "Owner",
                },
            }
        ]

    monkeypatch.setattr(
        team_routes,
        "get_teams",
        fake_get_my_teams,
    )

    response = client.get("/api/teams")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Test Team"


def test_add_team_member_success(monkeypatch):
    def fake_add_team_member(
            user_id: str,
            team_id: str,
            member_id: str, 
            display_name: str,
    ):
        return {
            "id": team_id,
            "name": "Test Team",
            "ownerId": user_id,
            "members": [user_id, member_id],
            "memberNames": {
                user_id: "Owner",
                member_id: display_name,
            },

        }

    monkeypatch.setattr(
        team_routes,
        "add_team_member",
        fake_add_team_member,
    )

    response = client.post(
        "/api/teams/team1/members",
        json={
            "memberId": "member-user-id",
            "displayName": "ZX",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == "team1"
    assert "member-user-id" in data["members"]
    assert data["memberNames"]["member-user-id"] =="ZX"




def test_leaderboard_success(monkeypatch):
    def fake_get_team_leaderboard(
            user_id: str,
            team_id: str,
    ):
        return [
            {
                "rank": 1,
                "userId":"member-user-id",
                "displayName": "ZX",
                "returnPercent": 12.3,
                "portfolioValue": 1230,
                "totalReturn": 152,

            },
            {
                "rank": 2,
                "userId":"owner-user-id",
                "displayName": "Owner",
                "returnPercent": 5.0,
                "portfolioValue": 1000,
                "totalReturn": 50,

            },
        ]
    monkeypatch.setattr(
        team_routes,
        "get_team_leaderboard",
        fake_get_team_leaderboard,
    )

    response = client.get(
        "/api/teams/team1/leaderboard"
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 2
    assert data[0]["rank"] == 1
    assert data[0]["displayName"] == "ZX"
    assert data[0]["returnPercent"] == 12.3

