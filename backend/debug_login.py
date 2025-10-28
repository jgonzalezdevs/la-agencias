#!/usr/bin/env python3
"""
Debug script to identify login issues.
Run this script to see detailed information about the login process.
"""

print("""
=" * 70
LOGIN DEBUG CHECKLIST
=" * 70

Please answer these questions to help debug the login issue:

1. What is the EXACT error message you're seeing?
   Examples:
   - "Incorrect email or password"
   - "Could not validate credentials"
   - "Inactive user"
   - 500 Internal Server Error
   - JWT/Token related error

2. How are you testing the login?
   a) Using Swagger UI at http://localhost:8000/api/v1/docs
   b) Using Postman/Insomnia
   c) Using curl command
   d) Using the frontend application

3. What credentials are you using?
   - Are you using a user that exists in the database?
   - Did you create the user through the /register endpoint?
   - Or did you manually insert it in the database?

4. Database connection:
   - Is the database running?
   - Are there any users in the database?
   - What is the hashed_password field value?

5. Environment variables:
   - Do you have a .env file configured?
   - Is SECRET_KEY set?
   - Is DATABASE_URL correct?

=" * 70
COMMON ISSUES AND SOLUTIONS
=" * 70

ISSUE 1: "Incorrect email or password" with CORRECT credentials
CAUSES:
  a) User doesn't exist in database
  b) Password was hashed differently when created
  c) Email case mismatch (user@example.com vs User@example.com)

SOLUTIONS:
  - Create a new user through /register endpoint
  - Check database: SELECT email, hashed_password FROM users;
  - Check email is lowercase in both register and login

ISSUE 2: "Could not validate credentials" AFTER successful login
CAUSES:
  a) SECRET_KEY mismatch between token creation and verification
  b) Token is malformed
  c) Missing dependencies (python-jose)

SOLUTIONS:
  - Verify SECRET_KEY in .env is the same throughout
  - Install: pip install python-jose[cryptography]
  - Check token format in response

ISSUE 3: Module import errors
CAUSES:
  a) Dependencies not installed
  b) Wrong Python environment

SOLUTIONS:
  - Install dependencies: poetry install or pip install -r requirements.txt
  - Activate virtual environment

ISSUE 4: Database connection errors
CAUSES:
  a) PostgreSQL not running
  b) Wrong DATABASE_URL
  c) Database doesn't exist

SOLUTIONS:
  - Start PostgreSQL: sudo systemctl start postgresql
  - Check DATABASE_URL format: postgresql+asyncpg://user:pass@host/db
  - Create database: createdb boleteria_db

=" * 70
QUICK FIX: Create a test user
=" * 70

Run these commands to create a test user directly:

1. Start the backend server:
   cd /home/jligo/leandro/backend
   uvicorn app.main:app --reload

2. Register a new user via Swagger UI or curl:
   curl -X POST "http://localhost:8000/api/v1/auth/register" \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "test@example.com",
       "full_name": "Test User",
       "password": "test123"
     }'

3. Try logging in:
   curl -X POST "http://localhost:8000/api/v1/auth/login" \\
     -H "Content-Type: application/x-www-form-urlencoded" \\
     -d "username=test@example.com&password=test123"

4. You should receive:
   {
     "access_token": "eyJ...",
     "refresh_token": "eyJ...",
     "token_type": "bearer"
   }

=" * 70

Now, let's check what we can verify programmatically:
""")

# Check if required files exist
import os
import sys

print("\n[1] Checking project structure...")
backend_path = "/home/jligo/leandro/backend"
required_files = [
    "app/main.py",
    "app/core/security.py",
    "app/apis/endpoints/auth.py",
    ".env.example"
]

for file in required_files:
    file_path = os.path.join(backend_path, file)
    exists = "✓" if os.path.exists(file_path) else "✗"
    print(f"  {exists} {file}")

print("\n[2] Checking .env file...")
env_file = os.path.join(backend_path, ".env")
if os.path.exists(env_file):
    print("  ✓ .env file exists")
    with open(env_file, 'r') as f:
        lines = f.readlines()
        has_secret = any('SECRET_KEY' in line and not line.strip().startswith('#') for line in lines)
        has_db = any('DATABASE_URL' in line and not line.strip().startswith('#') for line in lines)
        print(f"  {'✓' if has_secret else '✗'} SECRET_KEY configured")
        print(f"  {'✓' if has_db else '✗'} DATABASE_URL configured")
else:
    print("  ✗ .env file NOT found!")
    print("  → Copy .env.example to .env and configure it")

print("\n[3] Checking Python dependencies...")
try:
    import fastapi
    print(f"  ✓ fastapi {fastapi.__version__}")
except ImportError:
    print("  ✗ fastapi not installed")

try:
    import sqlalchemy
    print(f"  ✓ sqlalchemy {sqlalchemy.__version__}")
except ImportError:
    print("  ✗ sqlalchemy not installed")

try:
    import jose
    print("  ✓ python-jose installed")
except ImportError:
    print("  ✗ python-jose NOT installed - This will cause JWT errors!")

try:
    import passlib
    print("  ✓ passlib installed")
except ImportError:
    print("  ✗ passlib NOT installed - This will cause password hashing errors!")

print("\n" + "=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print("""
1. If dependencies are missing:
   pip install fastapi uvicorn[standard] sqlalchemy asyncpg python-jose[cryptography] passlib[bcrypt] pydantic-settings

2. If .env is not configured:
   cp .env.example .env
   # Then edit .env with your actual values

3. If database is not set up:
   # Create database
   createdb boleteria_db
   # Run migrations
   alembic upgrade head

4. Start the server and test:
   uvicorn app.main:app --reload
   # Then visit http://localhost:8000/api/v1/docs

5. Share the EXACT error message you're seeing for more specific help.
""")
