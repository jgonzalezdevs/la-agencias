"""Test the available years endpoint."""
import requests

# Login
print("🔐 Logging in...")
login_response = requests.post(
    'http://localhost:5050/api/v1/auth/login',
    data={'username': 'test@boleteria.com', 'password': 'test123'}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    exit(1)

token = login_response.json()['access_token']
print(f"✅ Got token: {token[:20]}...")

# Test available years endpoint
print("\n📅 Testing /api/v1/stats/available-years:")
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:5050/api/v1/stats/available-years', headers=headers)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Success! Available years: {data}")
else:
    print(f"❌ Failed: {response.status_code} - {response.text}")

# Test orders endpoint
print("\n📦 Testing /api/v1/orders/with-details/list:")
response = requests.get('http://localhost:5050/api/v1/orders/with-details/list?limit=5', headers=headers)

if response.status_code == 200:
    orders = response.json()
    print(f"✅ Got {len(orders)} orders")
    if orders:
        print(f"\nFirst order:")
        order = orders[0]
        print(f"  - ID: {order['id']}")
        print(f"  - Customer: {order['customer']['full_name']}")
        print(f"  - Services: {len(order['services'])}")
        for service in order['services']:
            if service.get('departure_datetime'):
                print(f"    • {service['service_type']}: {service['name']} - {service['departure_datetime']}")
else:
    print(f"❌ Failed: {response.status_code} - {response.text}")
