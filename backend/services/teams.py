from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore

from config.firebase_admin import db

from routes.portfolio import get_portfolio_for_others



def create_team(user_id: str, name: str) -> dict[str, Any]:
    if not user_id:
        raise ValueError("User ID is required.")
    
    team_name = name.strip()

    if not team_name:
        raise ValueError("Team name is required.")
    
    now = datetime.now(timezone.utc)

    team_data = {
        "name": team_name,
        "ownerId": user_id,
        "members": [user_id],
        "memberNames": {
            user_id: "Owner",
        },
        "createdAt": now,
        "updatedAt": now,
    }

    doc_ref = db.collection("teams").document()
    doc_ref.set(team_data)

    return {
        "id": doc_ref.id,
        **team_data,
    }


def get_teams(user_id: str) -> list[dict[str, Any]]:
    team_snapshots = (
        db.collection("teams")
        .where("members", "array_contains", user_id)
        .stream()
    )

    teams = []

    for snapshot in team_snapshots:
        teams.append({
            "id": snapshot.id,
            **snapshot.to_dict(),
        })
    
    return teams

def get_team(user_id: str, team_id: str) -> dict[str, Any]:
    doc_ref = db.collection("teams").document(team_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise ValueError("Team was not found.")
    
    team = snapshot.to_dict()

    if user_id not in team.get("members", []):
        raise ValueError("You are not a member of this team")
    
    return {
        "id": snapshot.id,
        **team,
    }


def add_team_member(
    user_id: str,
    team_id: str,
    member_id: str,
    display_name: str,
        
) -> dict[str, Any]:
    doc_ref = db.collection("teams").document(team_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise ValueError("Team was not found.")
    
    team = snapshot.to_dict()

    if team.get("ownerId") != user_id:
        raise ValueError("Only team owner can add members.")
    
    member_id = member_id.strip()
    display_name = display_name.strip() or member_id

    if not member_id:
        raise ValueError("Member ID is required.")
    
    members = team.get("members", [])
    member_names = team.get("memberNames", {})

    if member_id not in members:
        members.append(member_id)


    member_names[member_id] = display_name

    doc_ref.update({
        "members": members,
        "memberNames": member_names,
        "updatedAt": datetime.now(timezone.utc),
    })

    updated_snapshot = doc_ref.get()

    return {
        "id": updated_snapshot.id,
        **updated_snapshot.to_dict(),
    }



def get_team_leaderboard(
    user_id: str,
    team_id: str,
) -> list[dict[str, Any]]:
    
    team = get_team(user_id, team_id)

    members = team.get("members", [])
    member_names = team.get("memberNames", {})

    leaderboard = []

    for member_id in members:
        portfolio = get_portfolio_for_others(member_id)

        leaderboard.append({
            "user_id": member_id,
            "displayName": member_names.get(member_id, member_id),
            "returnPercent": portfolio["totalReturnPercent"],
        })

        leaderboard.sort(
            key=lambda row: row["returnPercent"],
            reverse=True,
        )

        for index, row in enumerate(leaderboard):
            row["rank"] = index + 1

    return leaderboard
