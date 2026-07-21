from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from typing import Literal

from auth import get_current_user_id


from services.teams import (
    create_team,
    get_teams,
    get_team,
    add_team_member,
    get_team_leaderboard,
)

router = APIRouter(
    prefix="/api/teams",
    tags=["teams"],
)

class TeamCreate(BaseModel):
    name: str

class TeamMemberAdd(BaseModel):
    memberId: str
    displayName: str = ""

@router.post("")
async def create_team_r(
    team: TeamCreate,
    user_id: str = Depends(get_current_user_id),
): 
    try: 
        return create_team(user_id = user_id, name = team.name,)
    except ValueError as error:
        raise HTTPException(
            status_code=400, detail=str(error),
        )
    
@router.get("")
async def get_teams_r(
    user_id: str = Depends(get_current_user_id),
): 
    return get_teams(user_id)

@router.get("/{team_id}")
async def get_team_r(
    team_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return get_team(user_id=user_id, team_id=team_id,)
    
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error),)


@router.post("/{team_id}/members")
async def add_member_r(
    team_id: str,
    member: TeamMemberAdd,
    user_id: str = Depends(get_current_user_id),
): 
    try:
        return add_team_member(
            user_id=user_id,
            team_id=team_id,
            member_id=member.memberId,
            display_name=member.displayName,
        )
    
    except ValueError as error:
        raise HTTPException(
            status_code=400, detail=str(error),
        )

@router.get("/{team_id}/leaderboard")
async def leaderboard_r(
    team_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return get_team_leaderboard(user_id=user_id, team_id=team_id,)
    
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error),)
    


    
