"""Simulate frontend calendar loading flow."""
import requests
import json

BASE_URL = 'http://localhost:5050/api/v1'

print("=" * 60)
print("TESTING CALENDAR FRONTEND FLOW")
print("=" * 60)

# Step 1: Login
print("\n1️⃣ STEP 1: Login")
print("-" * 60)
login_response = requests.post(
    f'{BASE_URL}/auth/login',
    data={'username': 'test@boleteria.com', 'password': 'test123'}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    print("\n💡 You need to login to the frontend first at http://localhost:4200/signin")
    print("   Use: test@boleteria.com / test123")
    exit(1)

token = login_response.json()['access_token']
print(f"✅ Login successful")
print(f"   Token: {token[:30]}...")

headers = {'Authorization': f'Bearer {token}'}

# Step 2: Load available years
print("\n2️⃣ STEP 2: Load Available Years")
print("-" * 60)
years_response = requests.get(f'{BASE_URL}/stats/available-years', headers=headers)

if years_response.status_code != 200:
    print(f"❌ Failed to load years: {years_response.text}")
    exit(1)

years_data = years_response.json()
print(f"✅ Available years loaded: {years_data['years']}")

if not years_data['years']:
    print("⚠️  No years available - no trips with departure dates found")
    exit(0)

selected_year = years_data['years'][0]
print(f"   Selected year: {selected_year}")

# Step 3: Load orders with details
print("\n3️⃣ STEP 3: Load Orders with Details")
print("-" * 60)
orders_response = requests.get(
    f'{BASE_URL}/orders/with-details/list?limit=500',
    headers=headers
)

if orders_response.status_code != 200:
    print(f"❌ Failed to load orders: {orders_response.text}")
    exit(1)

orders = orders_response.json()
print(f"✅ Orders loaded: {len(orders)} orders")

# Step 4: Process orders into calendar events
print("\n4️⃣ STEP 4: Process Orders into Calendar Events")
print("-" * 60)

all_events = []
for order in orders:
    # Find main service (FLIGHT or BUS)
    main_service = None
    for service in order['services']:
        if service['service_type'] in ['FLIGHT', 'BUS']:
            main_service = service
            break

    if not main_service:
        # Use first service
        main_service = order['services'][0] if order['services'] else None

    if not main_service:
        continue

    # Determine event date
    if main_service.get('departure_datetime'):
        event_date = main_service['departure_datetime'].split('T')[0]
    else:
        event_date = order['created_at'].split('T')[0]

    # Create calendar event
    event = {
        'id': str(order['id']),
        'title': f"{order['customer']['full_name']} - Trip",
        'start': event_date,
        'customer': order['customer']['full_name'],
        'services_count': len(order['services']),
    }
    all_events.append(event)

print(f"✅ Created {len(all_events)} calendar events")

# Step 5: Filter by selected year
print("\n5️⃣ STEP 5: Filter Events by Year")
print("-" * 60)

filtered_events = []
for event in all_events:
    event_year = int(event['start'].split('-')[0])
    if event_year == selected_year:
        filtered_events.append(event)

print(f"✅ Filtered to {len(filtered_events)} events for year {selected_year}")

# Show sample events
if filtered_events:
    print(f"\n📋 Sample Events:")
    for i, event in enumerate(filtered_events[:5]):
        print(f"   {i+1}. {event['start']} - {event['title']} ({event['services_count']} services)")
else:
    print("\n⚠️  No events found for the selected year!")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"✅ Authentication: Working")
print(f"✅ Available years: {years_data['years']}")
print(f"✅ Total orders: {len(orders)}")
print(f"✅ Calendar events: {len(all_events)}")
print(f"✅ Events for {selected_year}: {len(filtered_events)}")

if filtered_events:
    print(f"\n🎉 Calendar should show {len(filtered_events)} trips for year {selected_year}")
else:
    print(f"\n⚠️  No trips to display on calendar")
    print(f"   Possible reasons:")
    print(f"   - No orders have FLIGHT/BUS services with departure_datetime")
    print(f"   - Orders exist but are from different years")
    print(f"   - Need to create test data with current year dates")

print("\n💡 Frontend login URL: http://localhost:4200/signin")
print("   Credentials: test@boleteria.com / test123")
print("=" * 60)
