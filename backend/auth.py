from typing import Optional

from fastapi import Header, HTTPException, status
from firebase_admin import auth


async def get_current_user_id(
    authorization: Optional[str] = Header(default=None),
) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing.",
        )

    prefix = "Bearer "

    if not authorization.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer token.",
        )

    token = authorization[len(prefix):].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
        )

    try:
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token.get("uid")

        if not user_id:
            raise ValueError("Token does not contain a user ID.")

        return user_id

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        ) from error