"""Script to create the database if it doesn't exist."""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text

from app.core.config import settings


async def create_database():
    """Create the database if it doesn't exist."""

    # Get database URL and extract database name
    db_url = settings.DATABASE_URL
    db_name = db_url.split("/")[-1]

    # Connect to postgres database (default database)
    postgres_url = db_url.rsplit("/", 1)[0] + "/postgres"

    print(f"Connecting to PostgreSQL...")
    print(f"Database to create: {db_name}")

    # Create engine for postgres database
    engine = create_async_engine(postgres_url, isolation_level="AUTOCOMMIT")

    try:
        async with engine.connect() as conn:
            # Check if database exists
            result = await conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
            )
            exists = result.scalar()

            if exists:
                print(f"✅ Database '{db_name}' already exists")
            else:
                # Create database
                await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                print(f"✅ Database '{db_name}' created successfully")

    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_database())
