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
    tradeStatus = str(entry_data.get("tradeStatus", "")).strip()
    
    

    entry_price = float(entry_data.get("entryPrice", 0))
    quantity = float(entry_data.get("quantity", 0))
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

    #max_favourable_excursion = float(
        #entry_data.get("maxFavourableExcursion", 0)
    #)

    # max_adverse_excursion = float(
    #     entry_data.get("maxAdverseExcursion", 0)
    # )

    confidence = int(entry_data.get("confidence", 3))

    emotions = str(
        entry_data.get("emotions", "")
    ).strip()

    exit_price_raw = entry_data.get("exitPrice")
    pnl_raw = entry_data.get("pnl")

    exit_price = (
        float(exit_price_raw)
        if exit_price_raw is not None
        else None
    )

    pnl = (
        float(pnl_raw)
        if pnl_raw is not None
        else None
    )

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
    
    if tradeStatus == "Closed":
        if exit_price is None:
            raise ValueError(
                "Exit price is required when trade status is Closed."
            )

        if pnl is None:
            raise ValueError(
                "PnL is required when trade status is Closed."
            )



    now = datetime.now(timezone.utc)

    new_entry = {
        "title": title,
        "ticker": ticker,
        "direction": direction,
        "tradeStatus": tradeStatus,
        "quantity": quantity,
        "entryPrice": entry_price,
        "positionSize": position_size,
        "timePeriod": time_period,
        "riskToReward": risk_to_reward,
        "thesis": thesis,
        "catalyst": catalyst,
        "executionErrors": execution_errors,
        # "maxFavourableExcursion": max_favourable_excursion,
        # "maxAdverseExcursion": max_adverse_excursion,
        "confidence": confidence,
        "emotions": emotions,
        "exitPrice": exit_price,
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

def get_journal_entry_byid(
        entry_id: str,
    user_id: str,
) -> dict[str, Any] | None:
    document = (
        db.collection("users")
        .document(user_id)
        .collection("journalEntries")
        .document(entry_id)
        .get()
    )

    if not document.exists:
        return None
    
    entry = document.to_dict() or {}
    entry["id"] = document.id

    return entry

def delete_journal_entry (
    user_id: str,
    entry_id: str,
) -> bool:
    if not user_id:
        raise ValueError("User ID is required.")
    
    if not entry_id:
        raise ValueError("Journal entry ID is required.")
    
    document_reference = (db.collection("users")
                            .document(user_id)
                            .collection("journalEntries")
                            .document(entry_id))
    
    document_snapshot = document_reference.get()

    if not document_snapshot.exists:
        return False
    
    document_reference.delete()
    return True


ALLOWED_JOURNAL_FIELDS = {
    "title",
    "ticker",
    "direction",
    "tradeStatus",
    "entryPrice",
    "quantity",
    "exitPrice",
    "positionSize",
    "timePeriod",
    "riskToReward",
    "stopLoss",
    "takeProfit",
    "thesis",
    "catalyst",
    "executionErrors",
    # "maxFavourableExcursion",
    # "maxAdverseExcursion",
    "confidence",
    "emotions",
    "pnl",
    "lessonsLearnt",
}

def optional_float(value):
    if value is None or value == "":
        return None

    return float(value)

def update_journal_entries(
    user_id: str,
    entry_id: str,
    entry_data: dict[str, Any],
) -> dict[str, Any] | None:
    
    if not user_id:
        raise ValueError("User ID is required.")
    
    if not entry_id:
        raise ValueError("Journal entry ID is required.")
    
    document_reference = (
        db.collection("users")
        .document(user_id)
        .collection("journalEntries")
        .document(entry_id)
    )

    document_snapshot = document_reference.get()

    if not document_snapshot.exists:
        return None
    
    updates = {
        key: value
        for key, value in entry_data.items()
        if key in ALLOWED_JOURNAL_FIELDS

    }

    if not updates:
        raise ValueError("No valid updates were made.")
    
    if "ticker" in updates:
        updates["ticker"] = str(updates["ticker"]).strip().upper()

    if "direction" in updates:
        direction = str(updates["direction"].strip().title())

        if direction not in {"Buy", "Sell"}:
            raise ValueError("Direction must be Buy or Sell.")
        
        updates["direction"] = direction
    
    if "tradeStatus" in updates:
        trade_status = str(
            updates["tradeStatus"]
        ).strip().title()

        if trade_status not in {"Open", "Closed"}:
            raise ValueError(
                "Trade status must be Open or Closed."
            )

        updates["tradeStatus"] = trade_status

        if trade_status == "Open":
            updates["exitPrice"] = None
            updates["exitDate"] = None
            updates["pnl"] = None
            updates["executionErrors"] = ""
            updates["maxFavourableExcursion"] = None
            updates["maxAdverseExcursion"] = None
            updates["lessonsLearnt"] = ""

    for field in [
        "entryPrice",
        "quantity",
        "positionSize",
        "riskToReward",
        "stopLoss",
        "takeProfit",
        "exitPrice",
        "pnl",
    ]:
        if field in updates:
            updates[field] = optional_float(
                updates[field]
            )

    if updates.get("tradeStatus") == "Closed":
        if updates.get("exitPrice") is None:
            raise ValueError(
                "Exit price is required when trade status is Closed."
            )

        if updates.get("pnl") is None:
            raise ValueError(
                "PnL is required when trade status is Closed."
            )
    
    updates["updatedAt"] = datetime.now(timezone.utc)

    document_reference.update(updates)

    updated_snapshot = document_reference.get()

    return {
        "id": updated_snapshot.id,
        **updated_snapshot.to_dict(),
    }