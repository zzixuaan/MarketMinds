from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore

from config.firebase_admin import db


def create_journal_entry(
    user_id: str,
    entry_data: dict[str, Any],
) -> dict[str, Any]:
    if not user_id:
        raise ValueError("User ID is required.")

    title = str(entry_data.get("title", "")).strip()
    ticker = str(entry_data.get("ticker", "")).strip().upper()
    direction = str(entry_data.get("direction", "")).strip()

    entry_price = float(entry_data.get("entryPrice", 0))
    position_size = float(entry_data.get("positionSize", 0))

    time_period = str(
        entry_data.get("timePeriod", "")
    ).strip()

    risk_to_reward = float(
        entry_data.get("riskToReward", 0)
    )

    thesis = str(entry_data.get("thesis", "")).strip()
    catalyst = str(entry_data.get("catalyst", "")).strip()

    execution_errors = str(
        entry_data.get("executionErrors", "")
    ).strip()

    max_favourable_excursion = float(
        entry_data.get("maxFavourableExcursion", 0)
    )

    max_adverse_excursion = float(
        entry_data.get("maxAdverseExcursion", 0)
    )

    confidence = int(entry_data.get("confidence", 3))

    emotions = str(
        entry_data.get("emotions", "")
    ).strip()

    pnl = float(entry_data.get("pnl", 0))

    if not thesis:
        raise ValueError("Trade thesis is required.")

    if confidence < 1 or confidence > 5:
        raise ValueError(
            "Confidence must be between 1 and 5."
        )

    if entry_price < 0:
        raise ValueError("Entry price cannot be negative.")

    if position_size < 0:
        raise ValueError("Position size cannot be negative.")

    now = datetime.now(timezone.utc) + 8

    new_entry = {
        "title": title,
        "ticker": ticker,
        "direction": direction,
        "entryPrice": entry_price,
        "positionSize": position_size,
        "timePeriod": time_period,
        "riskToReward": risk_to_reward,
        "thesis": thesis,
        "catalyst": catalyst,
        "executionErrors": execution_errors,
        "maxFavourableExcursion": max_favourable_excursion,
        "maxAdverseExcursion": max_adverse_excursion,
        "confidence": confidence,
        "emotions": emotions,
        "pnl": pnl,
        "createdAt": now,
        "updatedAt": now,
    }

    document_reference = (
        db.collection("users")
        .document(user_id)
        .collection("journalEntries")
        .document()
    )

    document_reference.set(new_entry)

    return {
        "id": document_reference.id,
        **new_entry,
    }


def get_journal_entries(
    user_id: str,
) -> list[dict[str, Any]]:
    documents = (
        db.collection("users")
        .document(user_id)
        .collection("journalEntries")
        .order_by(
            "createdAt",
            direction=firestore.Query.DESCENDING,
        )
        .stream()
    )

    return [
        {
            "id": journal_document.id,
            **journal_document.to_dict(),
        }
        for journal_document in documents
    ]