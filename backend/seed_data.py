"""
Seed script to populate database with realistic test data for boletería system.
"""
import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.location import Location
from app.models.order import Order, OrderStatus
from app.models.service import Service, ServiceType
from app.core.security import get_password_hash


# Sample data
CITIES = [
    ("Bogotá", "Colombia", "BOG"),
    ("Medellín", "Colombia", "MDE"),
    ("Cali", "Colombia", "CLO"),
    ("Cartagena", "Colombia", "CTG"),
    ("Barranquilla", "Colombia", "BAQ"),
    ("Bucaramanga", "Colombia", "BGA"),
    ("Pereira", "Colombia", "PEI"),
    ("Santa Marta", "Colombia", "SMR"),
    ("Manizales", "Colombia", "MZL"),
    ("Cúcuta", "Colombia", "CUC"),
]

CUSTOMER_NAMES = [
    "Juan Pérez", "María García", "Carlos López", "Ana Martínez", "Luis Rodríguez",
    "Carmen Hernández", "José González", "Laura Sánchez", "Miguel Torres", "Isabel Ramírez",
    "Pedro Flores", "Sofía Castro", "Diego Morales", "Valentina Ortiz", "Andrés Gómez",
    "Camila Díaz", "Santiago Vargas", "Daniela Ruiz", "Felipe Mendoza", "Paula Silva"
]

OPERATOR_NAMES = [
    ("admin@boleteria.com", "Admin Principal", "admin"),
    ("operador1@boleteria.com", "Carlos Vendedor", "operador"),
    ("operador2@boleteria.com", "María Agente", "operador"),
    ("operador3@boleteria.com", "Luis Operador", "operador"),
    ("supervisor@boleteria.com", "Ana Supervisora", "supervisor"),
]


async def clear_data(session):
    """Clear existing data (optional - use with caution)."""
    print("⚠️  Clearing existing data...")
    # Delete in reverse order of foreign keys
    await session.execute(text("DELETE FROM services"))
    await session.execute(text("DELETE FROM orders"))
    await session.execute(text("DELETE FROM trips"))
    await session.execute(text("DELETE FROM customers"))
    # Don't delete users or locations
    await session.commit()
    print("✓ Data cleared")


async def seed_users(session):
    """Create operator users."""
    print("\n📊 Creating users...")

    for email, full_name, role in OPERATOR_NAMES:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()

        if not existing:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash("password123"),
                role=role,
                is_active=True,
                is_superuser=(role == "admin"),
                sales_count=0
            )
            session.add(user)
            print(f"  ✓ Created user: {email} ({role})")
        else:
            print(f"  → User exists: {email}")

    await session.commit()
    print(f"✓ Users ready")


async def seed_locations(session):
    """Create locations (cities)."""
    print("\n🌍 Creating locations...")

    for city_name, country, airport_code in CITIES:
        result = await session.execute(
            select(Location).where(Location.airport_code == airport_code)
        )
        existing = result.scalar_one_or_none()

        if not existing:
            location = Location(
                city=city_name,
                country=country,
                airport_code=airport_code,
                state=None  # Can be added later if needed
            )
            session.add(location)
            print(f"  ✓ Created location: {city_name}, {country} ({airport_code})")

    await session.commit()
    print(f"✓ {len(CITIES)} locations created")


async def seed_customers(session):
    """Create customer records."""
    print("\n👥 Creating customers...")

    for i, name in enumerate(CUSTOMER_NAMES):
        document_id = f"CC-{1000000 + i}"

        # Check if customer already exists
        result = await session.execute(
            select(Customer).where(Customer.document_id == document_id)
        )
        existing = result.scalar_one_or_none()

        if not existing:
            customer = Customer(
                full_name=name,
                document_id=document_id,
                phone_number=f"+57 300 {random.randint(1000000, 9999999)}",
                email=f"{name.lower().replace(' ', '.')}@example.com",
                notes=random.choice(["Cliente frecuente", "VIP", None, None])
            )
            session.add(customer)
            print(f"  ✓ Created customer: {name} ({document_id})")
        else:
            print(f"  → Customer exists: {name} ({document_id})")

    await session.commit()
    print(f"✓ Customers ready")


async def get_route_data(locations):
    """Helper function to generate route data for services."""
    routes = []

    # Create route combinations
    for i in range(len(locations)):
        for j in range(i + 1, min(i + 4, len(locations))):  # Connect to next 3 cities
            origin = locations[i]
            destination = locations[j]

            # Add both flight and bus options
            routes.append((origin, destination, ServiceType.FLIGHT))
            routes.append((origin, destination, ServiceType.BUS))

    return routes


async def seed_orders(session):
    """Create order history with realistic date distribution."""
    print("\n📦 Creating orders...")

    # Get all necessary data
    result = await session.execute(select(User))
    users = list(result.scalars().all())
    operators = [u for u in users if u.role in ["operador", "admin", "supervisor"]]

    result = await session.execute(select(Customer))
    customers = list(result.scalars().all())

    result = await session.execute(select(Location))
    locations = list(result.scalars().all())

    if not operators or not customers or not locations:
        print("⚠️  Missing required data for orders")
        return

    # Get route combinations
    routes = await get_route_data(locations)

    # Generate orders for the last 6 months
    end_date = datetime.now()

    order_count = 0
    for _ in range(200):  # Create 200 orders
        # Random date in the last 6 months (more recent orders are more common)
        days_ago = int(random.betavariate(2, 5) * 180)  # Bias towards recent
        order_date = end_date - timedelta(days=days_ago)

        operator = random.choice(operators)
        customer = random.choice(customers)

        # 85% paid, 10% pending, 5% cancelled
        status = random.choices(
            [OrderStatus.PAGADA, OrderStatus.PENDIENTE, OrderStatus.CANCELADA],
            weights=[85, 10, 5]
        )[0]

        # Random number of services (tickets) per order
        num_services = random.choices([1, 2, 3], weights=[70, 25, 5])[0]

        order = Order(
            order_number=f"ORD-{order_date.strftime('%Y%m')}-{order_count+1:05d}",
            user_id=operator.id,
            customer_id=customer.id,
            status=status,
            total_cost_price=Decimal("0"),
            total_sale_price=Decimal("0"),
            created_at=order_date
        )
        session.add(order)
        await session.flush()  # Get order ID

        # Add services (tickets) to this order
        total_cost = Decimal("0")
        total_sale = Decimal("0")

        for _ in range(num_services):
            origin, destination, service_type = random.choice(routes)

            # Generate prices based on service type
            if service_type == ServiceType.FLIGHT:
                cost = Decimal(str(random.randint(150, 400)))
                sale = Decimal(str(random.randint(200, 600)))
                company = random.choice(["Avianca", "LATAM", "Viva Air", "Wingo"])
                route_name = f"Vuelo {origin.airport_code} - {destination.airport_code}"
            else:  # BUS
                cost = Decimal(str(random.randint(30, 100)))
                sale = Decimal(str(random.randint(50, 150)))
                company = random.choice(["Expreso Brasilia", "Copetran", "Bolivariano", "Flota Magdalena"])
                route_name = f"Bus {origin.airport_code} - {destination.airport_code}"

            # Create departure datetime
            departure = order_date + timedelta(days=random.randint(7, 60))
            arrival = departure + timedelta(hours=random.randint(1, 8))

            service = Service(
                order_id=order.id,
                service_type=service_type,
                name=route_name,
                description=f"{company} - {origin.city} a {destination.city}",
                cost_price=cost,
                sale_price=sale,
                origin_location_id=origin.id,
                destination_location_id=destination.id,
                company=company,
                departure_datetime=departure,
                arrival_datetime=arrival,
                pnr_code=f"PNR{random.randint(100000, 999999)}",
                event_start_date=departure,
                event_end_date=arrival,
                calendar_color=random.choice(["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]),
                calendar_icon=random.choice(["plane", "bus"])
            )
            session.add(service)

            total_cost += cost
            total_sale += sale

        order.total_cost_price = total_cost
        order.total_sale_price = total_sale

        # Update operator's sales count
        if status == OrderStatus.PAGADA:
            operator.sales_count += 1

        order_count += 1

        if order_count % 50 == 0:
            print(f"  → Created {order_count} orders...")

    await session.commit()
    print(f"✓ {order_count} orders created with services")


async def main():
    """Main seeding function."""
    print("=" * 60)
    print("🌱 SEEDING DATABASE FOR BOLETERÍA SYSTEM")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        try:
            # Optional: Uncomment to clear existing data
            # await clear_data(session)

            await seed_users(session)
            await seed_locations(session)
            await seed_customers(session)
            await seed_orders(session)

            print("\n" + "=" * 60)
            print("✅ SEEDING COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print("\n📋 Login credentials:")
            print("  Admin:     admin@boleteria.com / password123")
            print("  Operator:  operador1@boleteria.com / password123")
            print("\n📊 Database seeded with:")
            print("  - 5 users (operators)")
            print("  - 10 locations (cities)")
            print("  - 20 customers")
            print("  - 200 orders with services (last 6 months)")
            print("\n")

        except Exception as e:
            print(f"\n❌ Error during seeding: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(main())
