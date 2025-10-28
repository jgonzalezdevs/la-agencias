"""Test script to verify authentication is working."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.core.security import create_access_token
from sqlalchemy import select
from app.models.user import User

async def test_auth():
    async with AsyncSessionLocal() as session:
        # Get first user
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"✅ Found user: {user.email}")
            token = create_access_token(subject=user.email)
            print(f"\n🔑 JWT Token for testing:")
            print(f"{token}")
            print(f"\nUse this token in your browser's localStorage:")
            print(f"localStorage.setItem('access_token', '{token}');")
        else:
            print("❌ No users found in database")

if __name__ == "__main__":
    asyncio.run(test_auth())
