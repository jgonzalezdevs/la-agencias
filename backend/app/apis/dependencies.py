from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        email: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        # Verify it's an access token (not a refresh token)
        if email is None:
            raise credentials_exception
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Please use an access token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(email=email, token_type=token_type)
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Get current active user (must be active)."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """Get current superuser (must be active and superuser or admin role)."""
    if not current_user.is_superuser and current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


async def get_admin_or_operator(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Get current user that is either admin or operator.
    Used for calendar/orders endpoints that operators can access.
    """
    allowed_roles = ['admin', 'operador']
    if not current_user.is_superuser and current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin or operator access required."
        )
    return current_user
