"""
Check what data exists in the database.
"""
import asyncio
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.location import Location
from app.models.order import Order
from app.models.service import Service


async def check_data():
    """Check counts of all tables."""
    async with AsyncSessionLocal() as session:
        # Count users
        result = await session.execute(select(func.count(User.id)))
        user_count = result.scalar()
        print(f"👥 Users: {user_count}")

        # Count customers
        result = await session.execute(select(func.count(Customer.id)))
        customer_count = result.scalar()
        print(f"👨‍💼 Customers: {customer_count}")

        # Count locations
        result = await session.execute(select(func.count(Location.id)))
        location_count = result.scalar()
        print(f"🌍 Locations: {location_count}")

        # Count orders
        result = await session.execute(select(func.count(Order.id)))
        order_count = result.scalar()
        print(f"📦 Orders: {order_count}")

        # Count services
        result = await session.execute(select(func.count(Service.id)))
        service_count = result.scalar()
        print(f"✈️  Services: {service_count}")

        # Check services by type
        result = await session.execute(
            select(Service.service_type, func.count(Service.id))
            .group_by(Service.service_type)
        )
        print("\n📊 Services by type:")
        for service_type, count in result:
            print(f"  - {service_type}: {count}")

        # Check orders with services
        result = await session.execute(
            select(Order.id, func.count(Service.id))
            .outerjoin(Service, Service.order_id == Order.id)
            .group_by(Order.id)
            .limit(5)
        )
        print("\n🔍 Sample orders with service counts:")
        for order_id, service_count in result:
            print(f"  - Order #{order_id}: {service_count} services")


if __name__ == "__main__":
    asyncio.run(check_data())
