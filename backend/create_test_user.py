"""Create a test user with known credentials."""
import asyncio
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_test_user():
    """Create test user."""
    async for db in get_db():
        # Check if test user exists
        result = await db.execute(
            select(User).where(User.email == "test@boleteria.com")
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"✅ Test user already exists: test@boleteria.com")
            # Update password
            existing_user.hashed_password = get_password_hash("test123")
            await db.commit()
            print(f"✅ Updated password to: test123")
        else:
            # Create new test user
            test_user = User(
                email="test@boleteria.com",
                full_name="Test User",
                hashed_password=get_password_hash("test123"),
                role="admin",
                is_active=True
            )
            db.add(test_user)
            await db.commit()
            print(f"✅ Created test user: test@boleteria.com / test123")

        break

if __name__ == "__main__":
    asyncio.run(create_test_user())
