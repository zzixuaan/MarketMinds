from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from typing import Literal

from auth import get_current_user_id
from services.journal_service import (
    create_journal_entry,
    get_journal_entries,
    delete_journal_entry,
    update_journal_entries,
    get_journal_entry_byid,
)


router = APIRouter(
    prefix="/api/journal",
    tags=["journal"],
)


class JournalEntryCreate(BaseModel):
    title: str = ""
    ticker: str = ""
    direction: str = Literal["Buy", "Sell"]

    entryPrice: float = Field(default=0, ge=0)
    positionSize: float = Field(default=0, ge=0)

    stopLoss: float = Field(default=0, ge=0)
    takeProfit: float = Field(default=0, ge=0)
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
    lessonsLearnt: str = ""


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


@router.get("/{entry_id}")
async def get_journal_entry(entry_id: str, user_id: str = Depends(get_current_user_id),):
    entry = get_journal_entry_byid(entry_id, user_id)

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Journal entry not found."
        )
    
    return entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT,)

async def delete_entry(entry_id: str, user_id: str = Depends(get_current_user_id),):
    try: 
        was_deleted = delete_journal_entry(user_id=user_id, entry_id=entry_id,)

        if not was_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry was not found.",
            )
        
        return Response(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry was not found.",
        )
    
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    

class JournalEntryUpdate(BaseModel):
    title: str | None = None
    ticker: str | None = None
    direction: Literal["Buy", "Sell"] | None = None

    entryPrice: float | None = None
    positionSize: float | None = None

    stopLoss: float | None = None
    takeProfit: float | None = None
    timePeriod: str | None = None
    riskToReward: float | None = None

    thesis: str | None = None
    catalyst: str | None = None

    executionErrors: str | None = None
    maxFavourableExcursion: float | None = None
    maxAdverseExcursion: float | None = None

    confidence: int | None = None
    emotions: str | None = None

    pnl: float | None = None
    lessonsLearnt: str | None = None
    

@router.patch("/{entryId}")
async def update_entry(
    entry_id: str,
    update_data: JournalEntryUpdate,
    user_id: str = Depends(get_current_user_id)
):
    try:
        updates = update_data.model_dump(
            exclude_unset=True
        )

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="No fields were provided.",
            )
        
        updated_entry = update_journal_entries(
            user_id = user_id,
            entry_id = entry_id,
            entry_data = updates,
        )

        if updated_entry is None:
            raise HTTPException(
                status_code=404,
                detail="Journal entry was not found.",
            )
        
        return updated_entry
    
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error),) from error