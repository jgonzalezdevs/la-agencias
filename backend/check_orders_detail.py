"""
Check order details with services and locations.
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.order import Order
from app.models.service import Service


async def check_order_details():
    """Check detailed order data."""
    async with AsyncSessionLocal() as session:
        # Get first 3 orders with all details
        stmt = select(Order).options(
            selectinload(Order.user),
            selectinload(Order.customer),
            selectinload(Order.services).selectinload(Service.origin_location),
            selectinload(Order.services).selectinload(Service.destination_location)
        ).limit(3)

        result = await session.execute(stmt)
        orders = result.scalars().all()

        for order in orders:
            print(f"\n📦 Order #{order.id} - {order.order_number}")
            print(f"  Status: {order.status}")
            print(f"  Customer: {order.customer.full_name if order.customer else 'N/A'}")
            print(f"  User: {order.user.full_name if order.user else 'N/A'}")
            print(f"  Total: ${order.total_sale_price}")
            print(f"  Services ({len(order.services)}):")

            for service in order.services:
                print(f"    - {service.service_type}: {service.name}")
                print(f"      Company: {service.company}")
                print(f"      Origin ID: {service.origin_location_id}")
                print(f"      Destination ID: {service.destination_location_id}")

                if service.origin_location:
                    print(f"      Origin: {service.origin_location.city} ({service.origin_location.airport_code})")
                else:
                    print(f"      Origin: NOT LOADED")

                if service.destination_location:
                    print(f"      Destination: {service.destination_location.city} ({service.destination_location.airport_code})")
                else:
                    print(f"      Destination: NOT LOADED")


if __name__ == "__main__":
    asyncio.run(check_order_details())
