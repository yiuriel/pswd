#!/bin/bash

# Database Reset Script
# Use this to clean up and recreate database tables

set -e

echo "🗑️  Resetting database schema..."

psql -U pswd -d pswd << 'EOF'
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS vault_entries CASCADE;
DROP TABLE IF EXISTS vaults CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Optionally drop extension (uncomment if needed)
-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Verify cleanup
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
EOF

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Now restart your backend server to recreate tables:"
echo "  cd backend && go run cmd/server/main.go"
