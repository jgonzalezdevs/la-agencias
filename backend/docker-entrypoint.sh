#!/bin/bash
set -e

echo "Starting backend application..."

# Try to run migrations, but don't fail if there are issues
echo "Attempting to run database migrations..."
if alembic upgrade head; then
    echo "✓ Migrations completed successfully"
else
    echo "⚠ Warning: Migrations failed or have conflicts"
    echo "⚠ Starting server anyway - migrations can be run manually"
    echo "⚠ Run 'docker compose exec backend alembic heads' to check migration status"
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
