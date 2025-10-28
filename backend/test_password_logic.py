#!/usr/bin/env python3
"""
Test password hashing logic independently
"""
import hashlib

def simulate_hash_with_long_password(password: str) -> str:
    """Simulate the hashing logic from security.py"""
    print(f"\nOriginal password: '{password}'")
    print(f"Password length: {len(password)} chars")
    print(f"Password bytes length: {len(password.encode('utf-8'))} bytes")

    if len(password.encode('utf-8')) > 72:
        print("⚠️  Password exceeds 72 bytes - applying SHA256 before bcrypt")
        hashed_input = hashlib.sha256(password.encode('utf-8')).hexdigest()
        print(f"SHA256 hash: {hashed_input}")
        return hashed_input
    else:
        print("✓ Password within 72 bytes - using directly with bcrypt")
        return password

# Test scenarios
print("=" * 70)
print("Testing Password Hashing Logic")
print("=" * 70)

# Test 1: Normal password
print("\n1. Normal Password Test:")
password1 = "test123"
result1 = simulate_hash_with_long_password(password1)

# Test 2: Long password
print("\n2. Long Password Test (100 chars):")
password2 = "a" * 100
result2 = simulate_hash_with_long_password(password2)

# Test 3: Special characters
print("\n3. Special Characters Test:")
password3 = "P@ssw0rd!#$%"
result3 = simulate_hash_with_long_password(password3)

# Test 4: UTF-8 characters (may take more bytes)
print("\n4. UTF-8 Characters Test:")
password4 = "contraseña🔐"
result4 = simulate_hash_with_long_password(password4)

print("\n" + "=" * 70)
print("POTENTIAL ISSUE IDENTIFIED:")
print("=" * 70)
print("""
⚠️  CRITICAL BUG: The password hashing logic has an inconsistency!

When a user REGISTERS with a long password (>72 bytes):
  - The password is hashed with SHA256 first, then bcrypt
  - The bcrypt hash is stored in the database

When the user LOGS IN with the same long password:
  - The password should also be hashed with SHA256 first
  - BUT if there's ANY mismatch in the process, verification fails

When a user REGISTERS with a normal password (<72 bytes):
  - The password is used directly with bcrypt
  - This works fine

The issue is that BOTH get_password_hash() and verify_password() must
apply the SAME transformation. Let's verify this is consistent in the code.
""")
