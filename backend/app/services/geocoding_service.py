"""Geocoding service for obtaining latitude and longitude from location data."""

import httpx
from decimal import Decimal
from typing import Tuple, Optional


async def geocode_location(
    city: str,
    country: str,
    state: Optional[str] = None
) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """
    Get latitude and longitude for a location using Nominatim (OpenStreetMap) API.

    Args:
        city: City name
        country: Country name
        state: Optional state/province name

    Returns:
        Tuple of (latitude, longitude) or (None, None) if not found
    """
    # Build query string
    query_parts = [city]
    if state:
        query_parts.append(state)
    query_parts.append(country)

    query = ", ".join(query_parts)

    # Nominatim API endpoint
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1
    }

    headers = {
        "User-Agent": "Boleteria-API/1.0"  # Required by Nominatim
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()

            data = response.json()

            if data and len(data) > 0:
                result = data[0]
                lat = Decimal(str(result["lat"]))
                lon = Decimal(str(result["lon"]))
                return (lat, lon)

            return (None, None)

    except Exception as e:
        # Log error but don't fail the location creation
        print(f"Geocoding error for {query}: {str(e)}")
        return (None, None)


async def geocode_airport(airport_code: str) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """
    Get latitude and longitude for an airport using its IATA code.

    Args:
        airport_code: IATA airport code (e.g., 'LIM', 'JFK')

    Returns:
        Tuple of (latitude, longitude) or (None, None) if not found
    """
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": f"{airport_code} airport",
        "format": "json",
        "limit": 1,
        "addressdetails": 1
    }

    headers = {
        "User-Agent": "Boleteria-API/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()

            data = response.json()

            if data and len(data) > 0:
                result = data[0]
                lat = Decimal(str(result["lat"]))
                lon = Decimal(str(result["lon"]))
                return (lat, lon)

            return (None, None)

    except Exception as e:
        print(f"Geocoding error for airport {airport_code}: {str(e)}")
        return (None, None)
