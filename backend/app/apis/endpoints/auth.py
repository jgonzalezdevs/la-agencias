from datetime import timedelta
from typing import Annotated
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import User as UserSchema
from app.schemas.user import UserCreate
from app.apis.dependencies import get_current_user

router = APIRouter()

# Temporary storage for reset tokens (in production, use Redis or database)
reset_tokens = {}


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth token."""
    token: str


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for reset password request."""
    token: str
    new_password: str


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    """Register a new user."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Login to get access token."""
    # Find user by email (username field contains email)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    # Verify credentials
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Create refresh token
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Refresh access token using refresh token.

    This endpoint allows users to get a new access token using a valid refresh token.
    The refresh token can be expired or valid - it will work as long as it's a valid refresh token.
    """
    from jose import JWTError
    from app.core.security import decode_access_token

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the refresh token
        payload = decode_access_token(refresh_request.refresh_token)
        email: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        # Verify it's a refresh token
        if email is None or token_type != "refresh":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Get user from database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Create new refresh token (rotate refresh tokens for security)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.post("/google", response_model=Token)
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Authenticate with Google OAuth token.

    Verifies the Google ID token and creates/updates user in database.
    """
    try:
        # Import Google OAuth libraries
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            auth_request.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # Extract user information from token
        email = idinfo['email']
        name = idinfo.get('name', email)
        email_verified = idinfo.get('email_verified', False)

        if not email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google email not verified",
            )

        # Find or create user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # Create new user from Google account
            user = User(
                email=email,
                full_name=name,
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # Random password
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        # Create refresh token
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": user.email}, expires_delta=refresh_token_expires
        )

        return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth library not installed. Run: pip install google-auth",
        )


@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Request a password reset email.

    Sends a password reset token to the user's email.
    In production, this should send an actual email with a reset link.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    # Even if user doesn't exist, return success message
    if not user:
        return {
            "message": "If the email exists, a password reset link has been sent."
        }

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)

    # Store token with expiration (1 hour)
    # In production, store this in Redis or database with expiration
    reset_tokens[reset_token] = {
        "email": user.email,
        "expires_at": timedelta(hours=1)  # This should be a datetime object in production
    }

    # TODO: Send email with reset token
    # In production, send actual email:
    # reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    # send_email(
    #     to=user.email,
    #     subject="Password Reset Request",
    #     body=f"Click here to reset your password: {reset_link}"
    # )

    # For development, just log the token
    print(f"Password reset token for {user.email}: {reset_token}")
    print(f"Reset link: http://localhost:4200/reset-password?token={reset_token}")

    return {
        "message": "If the email exists, a password reset link has been sent.",
        "dev_token": reset_token  # Only for development! Remove in production
    }


@router.post("/reset-password", response_model=dict)
async def reset_password(
    request: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Reset password using a reset token.

    Validates the reset token and updates the user's password.
    """
    # Verify token exists
    if request.token not in reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Get email from token
    token_data = reset_tokens[request.token]
    email = token_data["email"]

    # TODO: Check token expiration in production
    # if datetime.now() > token_data["expires_at"]:
    #     del reset_tokens[request.token]
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Reset token has expired",
    #     )

    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    await db.commit()

    # Remove used token
    del reset_tokens[request.token]

    return {"message": "Password has been reset successfully"}
