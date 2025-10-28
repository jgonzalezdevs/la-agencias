"""Create test data for calendar testing."""
import asyncio
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.models.service import Service, ServiceType
from app.models.location import Location
from app.core.security import get_password_hash


async def create_test_data():
    """Create test data for calendar."""
    async for db in get_db():
        print("🔧 Creating test data...")

        # Check if we already have data
        from sqlalchemy import select, func
        result = await db.execute(select(func.count(Service.id)))
        existing_count = result.scalar()

        if existing_count > 0:
            print(f"✅ Database already has {existing_count} services")

            # Show years available
            result = await db.execute(
                select(
                    func.distinct(func.extract("year", Service.departure_datetime)).label("year")
                )
                .where(Service.departure_datetime.is_not(None))
                .order_by(func.extract("year", Service.departure_datetime).desc())
            )
            years = [int(row.year) for row in result.all() if row.year is not None]
            print(f"📅 Years with data: {years}")

            # Show sample services
            result = await db.execute(
                select(Service.id, Service.service_type, Service.name, Service.departure_datetime)
                .where(Service.departure_datetime.is_not(None))
                .limit(5)
            )
            print("\n📋 Sample services:")
            for row in result.all():
                print(f"  - ID {row.id}: {row.service_type} - {row.name} - {row.departure_datetime}")

            return

        # Create test user
        test_user = User(
            email="test@example.com",
            full_name="Test User",
            hashed_password=get_password_hash("password123"),
            role="admin",
            is_active=True
        )
        db.add(test_user)
        await db.flush()
        print(f"✅ Created test user: {test_user.email}")

        # Create test customer
        test_customer = Customer(
            full_name="John Doe",
            email="john@example.com",
            phone="+1234567890",
            document_id="12345678"
        )
        db.add(test_customer)
        await db.flush()
        print(f"✅ Created test customer: {test_customer.full_name}")

        # Create locations
        bogota = Location(
            country="Colombia",
            state="Cundinamarca",
            city="Bogotá",
            airport_code="BOG"
        )
        medellin = Location(
            country="Colombia",
            state="Antioquia",
            city="Medellín",
            airport_code="MDE"
        )
        cali = Location(
            country="Colombia",
            state="Valle del Cauca",
            city="Cali",
            airport_code="CLO"
        )
        db.add_all([bogota, medellin, cali])
        await db.flush()
        print(f"✅ Created locations: Bogotá, Medellín, Cali")

        # Create test orders with services for 2024 and 2025
        base_date_2024 = datetime(2024, 6, 15, 10, 0)
        base_date_2025 = datetime(2025, 1, 15, 10, 0)

        routes = [
            ("Bogotá → Medellín", bogota.id, medellin.id),
            ("Medellín → Cali", medellin.id, cali.id),
            ("Cali → Bogotá", cali.id, bogota.id),
        ]

        service_count = 0

        # Create services for 2024
        for i, (route_name, origin_id, dest_id) in enumerate(routes):
            # Create order
            order = Order(
                customer_id=test_customer.id,
                user_id=test_user.id,
                status=OrderStatus.PAGADA,
                total_cost_price=150.00,
                total_sale_price=200.00,
                payment_method="Credit Card"
            )
            db.add(order)
            await db.flush()

            # Create FLIGHT service for 2024
            departure_date = base_date_2024 + timedelta(days=i * 30)
            arrival_date = departure_date + timedelta(hours=1, minutes=30)

            service = Service(
                order_id=order.id,
                service_type=ServiceType.FLIGHT,
                name=f"Flight {route_name}",
                description=f"Flight from {route_name.split(' → ')[0]} to {route_name.split(' → ')[1]}",
                cost_price=150.00,
                sale_price=200.00,
                origin_location_id=origin_id,
                destination_location_id=dest_id,
                departure_datetime=departure_date,
                arrival_datetime=arrival_date,
                pnr_code=f"PNR2024{i+1:03d}",
                company="Avianca"
            )
            db.add(service)
            service_count += 1

        # Create services for 2025
        for i, (route_name, origin_id, dest_id) in enumerate(routes * 3):  # 9 trips in 2025
            # Create order
            order = Order(
                customer_id=test_customer.id,
                user_id=test_user.id,
                status=OrderStatus.PAGADA,
                total_cost_price=150.00,
                total_sale_price=200.00,
                payment_method="Credit Card"
            )
            db.add(order)
            await db.flush()

            # Create FLIGHT service for 2025
            departure_date = base_date_2025 + timedelta(days=i * 10)
            arrival_date = departure_date + timedelta(hours=1, minutes=30)

            service = Service(
                order_id=order.id,
                service_type=ServiceType.FLIGHT,
                name=f"Flight {route_name}",
                description=f"Flight from {route_name.split(' → ')[0]} to {route_name.split(' → ')[1]}",
                cost_price=150.00,
                sale_price=200.00,
                origin_location_id=origin_id,
                destination_location_id=dest_id,
                departure_datetime=departure_date,
                arrival_datetime=arrival_date,
                pnr_code=f"PNR2025{i+1:03d}",
                company="LATAM"
            )
            db.add(service)
            service_count += 1

        await db.commit()
        print(f"✅ Created {service_count} flight services (3 for 2024, 9 for 2025)")
        print("✅ Test data creation complete!")
        break


if __name__ == "__main__":
    asyncio.run(create_test_data())
