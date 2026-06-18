from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import get_current_user_id
from services.journal_service import (
    create_journal_entry,
    get_journal_entries,
)


router = APIRouter(
    prefix="/api/journal",
    tags=["journal"],
)


class JournalEntryCreate(BaseModel):
    title: str = ""
    ticker: str = ""
    direction: str = ""

    entryPrice: float = Field(default=0, ge=0)
    positionSize: float = Field(default=0, ge=0)

    timePeriod: str = ""
    riskToReward: float = Field(default=0, ge=0)

    thesis: str = Field(min_length=1)
    catalyst: str = ""

    executionErrors: str = ""
    maxFavourableExcursion: float = 0
    maxAdverseExcursion: float = 0

    confidence: int = Field(default=3, ge=1, le=5)
    emotions: str = ""

    pnl: float = 0


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: JournalEntryCreate,
    user_id: str = Depends(get_current_user_id),
):
    try:
        if hasattr(entry, "model_dump"):
            entry_data = entry.model_dump()
        else:
            entry_data = entry.dict()

        return create_journal_entry(
            user_id=user_id,
            entry_data=entry_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get("")
async def list_entries(
    user_id: str = Depends(get_current_user_id),
):
    return get_journal_entries(user_id)