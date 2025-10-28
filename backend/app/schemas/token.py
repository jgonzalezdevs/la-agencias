from pydantic import BaseModel


class Token(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data schema."""

    email: str | None = None
    token_type: str | None = None  # "access" or "refresh"
