#!/bin/bash

# Log Viewer Script
# Quick access to service logs

case "$1" in
    backend|api)
        docker-compose logs -f backend
        ;;
    frontend|angular)
        docker-compose logs -f frontend
        ;;
    nginx|proxy)
        docker-compose logs -f nginx
        ;;
    db|database|postgres)
        docker-compose logs -f db
        ;;
    all|"")
        docker-compose logs -f
        ;;
    *)
        echo "Usage: ./logs.sh [service]"
        echo ""
        echo "Services:"
        echo "  backend   - FastAPI backend logs"
        echo "  frontend  - Angular frontend logs"
        echo "  nginx     - Nginx proxy logs"
        echo "  db        - Database logs"
        echo "  all       - All services (default)"
        exit 1
        ;;
esac
