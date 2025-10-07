# 🚀 PSWD Vault - Quick Reference Card

## 📍 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend (Docker)** | http://localhost:3000 | Create account |
| **Frontend (Manual)** | http://localhost:5173 | Create account |
| **Backend API** | http://localhost:8080 | - |
| **pgAdmin** | http://localhost:5050 | `admin@admin.com` / `admin` |
| **PostgreSQL** | localhost:5432 | `pswd` / `pswd` |

## 🐳 Docker Commands

```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Reset database (DANGER!)
docker-compose down -v && docker-compose up --build
```

## 💻 Manual Start

```bash
# Terminal 1 - Backend
cd backend && go run cmd/server/main.go

# Terminal 2 - Frontend
cd frontend && bun run dev
```

## 🗃️ Database Access

### Via pgAdmin (Visual)
1. Open http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Server already connected: "PSWD Vault Database"

### Via Command Line
```bash
# Docker
docker-compose exec db psql -U pswd -d pswd

# Local PostgreSQL
psql -U pswd -d pswd
```

### Quick Queries
```sql
-- Count users
SELECT COUNT(*) FROM users;

-- View all users with devices
SELECT u.username, d.device_name, d.is_master 
FROM users u 
LEFT JOIN devices d ON u.user_id = d.user_id;

-- Count vault entries
SELECT COUNT(*) FROM vault_entries;
```

## 🛠️ Common Tasks

### Reset Database
```bash
./reset_db.sh
# Or manually:
psql -U pswd -d pswd -c "DROP TABLE IF EXISTS vault_entries, vaults, devices, users CASCADE;"
```

### View Backend Logs
```bash
# Docker
docker-compose logs -f backend

# Manual
# Check terminal where you ran: go run cmd/server/main.go
```

### Test API
```bash
# Health check
curl http://localhost:8080/api/user/me
# Expected: "unauthorized" (normal without token)

# Register test user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123",
    "device_name": "My Device",
    "device_fingerprint": "test123",
    "pk_encrypt": "...",
    "pk_sign": "...",
    "pk_device": "..."
  }'
```

## 🔐 Security Notes

### What's Encrypted?
- ✅ Vault entries (end-to-end)
- ✅ Private keys in browser (IndexedDB + session encryption)
- ❌ Username, email (metadata visible to server)

### Key Storage
- **Development**: IndexedDB with encryption layer
- **Production**: Consider hardware security modules

### Default Passwords (CHANGE IN PRODUCTION!)
- pgAdmin: `admin@admin.com` / `admin`
- PostgreSQL: `pswd` / `pswd`
- JWT Secret: Hardcoded (change to env var)

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check database is running
psql -U pswd -d pswd -c "SELECT 1;"

# Docker: Check all services
docker-compose ps

# Check port 8080 is free
lsof -ti:8080
```

### Frontend Shows Connection Error
```bash
# Verify backend is running
curl http://localhost:8080/api/user/me

# Check browser console for CORS errors
# Frontend expects backend on :8080
```

### Database Errors
```bash
# View in pgAdmin
http://localhost:5050

# Check schema
docker-compose exec db psql -U pswd -d pswd -c "\dt"

# View backend startup logs
docker-compose logs backend | grep "✓"
```

### pgAdmin Not Loading
```bash
# Check container
docker-compose ps pgadmin

# Restart
docker-compose restart pgadmin

# View logs
docker-compose logs pgadmin
```

## 📁 File Structure

```
pswd/
├── backend/          - Go API server
├── frontend/         - React app
├── start.sh          - Auto-start script
├── reset_db.sh       - Database reset
└── docker-compose.yml - Docker config

📚 Documentation (all in root):
    • README.md - Start here
    • QUICKSTART.md - 5-min setup
    • DOCKER_GUIDE.md - Docker + pgAdmin
    • QUICK_REFERENCE.md - This file
    • STORAGE_SECURITY.md - Security info
    • IMPLEMENTATION_NOTES.md - TODOs
```

## 🎯 First Time Setup

**With Docker:**
1. **Start**: `docker-compose up --build`
2. **Frontend**: http://localhost:3000
3. **Create account** and add passwords
4. **View DB**: http://localhost:5050

**Manual:**
1. **Backend**: `cd backend && go run cmd/server/main.go`
2. **Frontend**: `cd frontend && bun run dev`
3. **Open**: http://localhost:5173

## 📚 Documentation

| Guide | What's In It |
|-------|--------------|
| [README.md](README.md) | Project overview, architecture, features |
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup (manual install) |
| [DOCKER_GUIDE.md](DOCKER_GUIDE.md) | Docker deployment + pgAdmin queries |
| [STORAGE_SECURITY.md](STORAGE_SECURITY.md) | Why IndexedDB > localStorage |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | Production TODOs |
| **QUICK_REFERENCE.md** | This cheat sheet |

## ⚡ Pro Tips

- Use pgAdmin to verify registration created user
- Check `devices` table to see master device flag
- View `vault_entries` to see encrypted data (Base64)
- Use browser DevTools → Application → IndexedDB to see encrypted keys
- Watch backend logs during registration to debug issues

## 🆘 Getting Help

1. Check appropriate guide from table above
2. View logs: `docker-compose logs -f`
3. Inspect database in pgAdmin
4. Check browser console for frontend errors
5. Review [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for known issues
