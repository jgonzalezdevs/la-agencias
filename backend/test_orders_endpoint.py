"""
Test the orders endpoint to verify it works correctly.
"""
import requests
import json

BASE_URL = "http://localhost:5050/api/v1"

def test_orders_endpoint():
    """Test the full flow: login -> get orders."""

    print("🔐 Step 1: Login...")
    login_data = {
        "username": "admin@boleteria.com",
        "password": "password123"
    }

    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data
    )

    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return

    token_data = response.json()
    token = token_data["access_token"]
    print(f"✅ Login successful! Token: {token[:20]}...")

    print("\n📦 Step 2: Get orders with details...")
    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(
        f"{BASE_URL}/orders/with-details/list?limit=5",
        headers=headers
    )

    if response.status_code != 200:
        print(f"❌ Failed to get orders: {response.status_code}")
        print(response.text)
        return

    orders = response.json()
    print(f"✅ Got {len(orders)} orders!")

    print("\n📊 Sample data:")
    for i, order in enumerate(orders[:3], 1):
        print(f"\n  Order {i}: {order['order_number']}")
        print(f"    Customer: {order['customer']['full_name']}")
        print(f"    Seller: {order['user']['full_name'] if order.get('user') else 'N/A'}")
        print(f"    Total: ${order['total_sale_price']}")
        print(f"    Services: {len(order['services'])}")

        for service in order['services']:
            if service['service_type'] in ['FLIGHT', 'BUS']:
                origin = service.get('origin_location', {})
                dest = service.get('destination_location', {})
                print(f"      - {service['service_type']}: {origin.get('city', 'N/A')} → {dest.get('city', 'N/A')}")

    print(f"\n✅ All tests passed! The backend is working correctly.")
    print(f"   Total orders available: {len(orders)}")


if __name__ == "__main__":
    try:
        test_orders_endpoint()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
