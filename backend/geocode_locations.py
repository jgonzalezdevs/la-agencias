#!/usr/bin/env python3
"""Script to geocode all existing locations in the database."""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.models.location import Location
from app.core.config import settings
from app.services import geocoding_service


async def geocode_all_locations():
    """Geocode all locations that don't have coordinates."""
    print("🌍 Starting geocoding process...")
    print(f"Database: {settings.DATABASE_URL.split('@')[-1]}\n")

    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Get all locations
        result = await session.execute(select(Location))
        all_locations = result.scalars().all()

        print(f"📍 Total locations in database: {len(all_locations)}")

        # Filter locations without coordinates
        locations_without_coords = [
            loc for loc in all_locations
            if loc.latitude is None or loc.longitude is None
        ]

        print(f"🔍 Locations without coordinates: {len(locations_without_coords)}")

        if not locations_without_coords:
            print("\n✅ All locations already have coordinates!")
            await engine.dispose()
            return

        print("\n" + "="*60)
        print("Starting geocoding process...")
        print("="*60 + "\n")

        geocoded = 0
        failed = 0
        failed_locations = []

        for i, location in enumerate(locations_without_coords, 1):
            location_name = f"{location.city}, {location.state or ''} {location.country}".replace("  ", " ")
            print(f"[{i}/{len(locations_without_coords)}] Geocoding: {location_name}")

            lat, lon = None, None

            # Try airport code first
            if location.airport_code:
                print(f"  → Trying airport code: {location.airport_code}")
                lat, lon = await geocoding_service.geocode_airport(location.airport_code)

                if lat and lon:
                    print(f"  ✅ Found via airport: {lat}, {lon}")

            # Try city/state/country if still no coordinates
            if not lat:
                print(f"  → Trying city/country geocoding...")
                lat, lon = await geocoding_service.geocode_location(
                    city=location.city,
                    country=location.country,
                    state=location.state
                )

                if lat and lon:
                    print(f"  ✅ Found via city: {lat}, {lon}")

            # Update location if coordinates found
            if lat and lon:
                location.latitude = lat
                location.longitude = lon
                geocoded += 1
            else:
                print(f"  ❌ Failed to geocode")
                failed += 1
                failed_locations.append(location_name)

            print()  # Empty line for readability

        # Commit all changes
        await session.commit()
        print("\n" + "="*60)
        print("Geocoding Complete!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"  • Total processed: {len(locations_without_coords)}")
        print(f"  • Successfully geocoded: {geocoded} ✅")
        print(f"  • Failed: {failed} ❌")

        if failed_locations:
            print(f"\n⚠️  Failed locations:")
            for loc in failed_locations:
                print(f"  - {loc}")

        print("\n🎉 Done!")

    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(geocode_all_locations())
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
