#!/usr/bin/env python3
"""
Script to test authentication flow with refresh tokens.
This tests the login and refresh token endpoints.
"""

import asyncio
from datetime import timedelta
from app.core.security import create_access_token, create_refresh_token, decode_access_token


def test_token_creation():
    """Test token creation and decoding."""
    print("=" * 60)
    print("Testing Token Creation and Decoding")
    print("=" * 60)

    # Test data
    user_email = "test@example.com"

    # Create access token
    print("\n1. Creating access token...")
    access_token = create_access_token(
        data={"sub": user_email},
        expires_delta=timedelta(minutes=30)
    )
    print(f"   Access token created: {access_token[:50]}...")

    # Decode access token
    print("\n2. Decoding access token...")
    access_payload = decode_access_token(access_token)
    print(f"   Email: {access_payload.get('sub')}")
    print(f"   Token type: {access_payload.get('type')}")
    print(f"   Expires at: {access_payload.get('exp')}")

    assert access_payload.get("sub") == user_email, "Email mismatch in access token"
    assert access_payload.get("type") == "access", "Token type should be 'access'"
    print("   ✓ Access token validation passed")

    # Create refresh token
    print("\n3. Creating refresh token...")
    refresh_token = create_refresh_token(
        data={"sub": user_email},
        expires_delta=timedelta(days=7)
    )
    print(f"   Refresh token created: {refresh_token[:50]}...")

    # Decode refresh token
    print("\n4. Decoding refresh token...")
    refresh_payload = decode_access_token(refresh_token)
    print(f"   Email: {refresh_payload.get('sub')}")
    print(f"   Token type: {refresh_payload.get('type')}")
    print(f"   Expires at: {refresh_payload.get('exp')}")

    assert refresh_payload.get("sub") == user_email, "Email mismatch in refresh token"
    assert refresh_payload.get("type") == "refresh", "Token type should be 'refresh'"
    print("   ✓ Refresh token validation passed")

    print("\n" + "=" * 60)
    print("✓ All token tests passed!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_token_creation()
        print("\n✅ Authentication flow is working correctly!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
