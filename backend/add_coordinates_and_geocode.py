#!/usr/bin/env python3
"""
Script to:
1. Add latitude and longitude columns to locations table (if not exists)
2. Geocode all existing locations
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from decimal import Decimal

from app.models.location import Location
from app.core.config import settings
from app.services import geocoding_service


async def add_columns_if_not_exist(session):
    """Add latitude and longitude columns if they don't exist."""
    print("🔧 Checking database schema...")

    try:
        # Try to add columns (PostgreSQL syntax)
        await session.execute(text("""
            ALTER TABLE locations
            ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
            ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)
        """))
        await session.commit()
        print("✅ Columns added or already exist\n")
    except Exception as e:
        print(f"⚠️  Column modification note: {e}\n")
        await session.rollback()


async def main():
    """Main execution function."""
    print("="*70)
    print("🌍 LOCATION GEOCODING SETUP")
    print("="*70)
    print()

    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            # Step 1: Add columns if needed
            await add_columns_if_not_exist(session)

            # Step 2: Get all locations
            result = await session.execute(select(Location))
            all_locations = result.scalars().all()

            print(f"📍 Total locations in database: {len(all_locations)}\n")

            if len(all_locations) == 0:
                print("⚠️  No locations found in database. Please create some locations first.")
                return

            # Show current locations
            print("Current locations:")
            print("-" * 70)
            for loc in all_locations:
                coords = f"({loc.latitude}, {loc.longitude})" if loc.latitude else "NO COORDS"
                airport = f" [{loc.airport_code}]" if loc.airport_code else ""
                print(f"  {loc.id:2d}. {loc.city:20s} {loc.country:15s} {airport:8s} {coords}")
            print("-" * 70)
            print()

            # Filter locations without coordinates
            locations_to_geocode = [
                loc for loc in all_locations
                if loc.latitude is None or loc.longitude is None
            ]

            if not locations_to_geocode:
                print("✅ All locations already have coordinates!")
                print("\n🎉 Nothing to do!")
                return

            print(f"🔍 Locations needing geocoding: {len(locations_to_geocode)}")
            print()

            # Geocode each location
            print("="*70)
            print("GEOCODING PROCESS")
            print("="*70)
            print()

            geocoded_count = 0
            failed_count = 0
            failed_list = []

            for i, location in enumerate(locations_to_geocode, 1):
                location_name = f"{location.city}, {location.country}"
                if location.state:
                    location_name = f"{location.city}, {location.state}, {location.country}"

                print(f"[{i}/{len(locations_to_geocode)}] {location_name}")

                lat, lon = None, None

                # Try airport code first
                if location.airport_code:
                    print(f"    → Trying airport code: {location.airport_code}")
                    lat, lon = await geocoding_service.geocode_airport(location.airport_code)

                    if lat and lon:
                        print(f"    ✅ Found: {lat}, {lon}")

                # Try city/state/country
                if not lat:
                    print(f"    → Trying city geocoding...")
                    lat, lon = await geocoding_service.geocode_location(
                        city=location.city,
                        country=location.country,
                        state=location.state
                    )

                    if lat and lon:
                        print(f"    ✅ Found: {lat}, {lon}")

                # Update if found
                if lat and lon:
                    location.latitude = lat
                    location.longitude = lon
                    geocoded_count += 1
                else:
                    print(f"    ❌ Could not geocode")
                    failed_count += 1
                    failed_list.append(location_name)

                print()

                # Small delay to respect rate limits
                await asyncio.sleep(1.1)  # Nominatim allows 1 request/second

            # Commit changes
            await session.commit()

            # Summary
            print("="*70)
            print("SUMMARY")
            print("="*70)
            print(f"Total processed:  {len(locations_to_geocode)}")
            print(f"✅ Geocoded:      {geocoded_count}")
            print(f"❌ Failed:        {failed_count}")

            if failed_list:
                print("\nFailed locations:")
                for loc in failed_list:
                    print(f"  - {loc}")

            print("\n🎉 Process completed!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
