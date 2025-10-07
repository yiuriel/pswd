# Quick Start Guide

Get your secure vault up and running in 5 minutes!

## Prerequisites Check

```bash
# Verify you have the required tools
bun --version     # Should be latest (install from https://bun.sh)
go version        # Should be 1.25+
psql --version    # Should be 14+
```

## 1. Database Setup (2 minutes)

```bash
# Start PostgreSQL (if not running)
# macOS with Homebrew:
brew services start postgresql@14

# Create database
createdb pswd

# Create user and grant permissions
psql pswd << EOF
CREATE USER pswd WITH ENCRYPTED PASSWORD 'pswd';
GRANT ALL PRIVILEGES ON DATABASE pswd TO pswd;
ALTER DATABASE pswd OWNER TO pswd;
EOF
```

## 2. Backend Setup (1 minute)

```bash
cd backend

# Install Go dependencies
go mod download

# Start the server (it will auto-create tables)
go run cmd/server/main.go
```

You should see:
```
🚀 Server running on http://localhost:8080
```

## 3. Frontend Setup (2 minutes)

Open a new terminal:

```bash
cd frontend

# Install dependencies with Bun
bun install

# Start the dev server
bun run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## 4. Test the Application

1. Open your browser to `http://localhost:5173`
2. Click **"Create Vault"**
3. Fill in the registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
   - Device Name: `My MacBook`
4. Watch the step-by-step setup process
5. You'll be redirected to the vault automatically

## 5. Create Your First Entry

1. Click **"Add Entry"**
2. Fill in:
   - Title: `Test Account`
   - Username: `myemail@example.com`
   - Click the refresh icon to generate a secure password
   - URL: `https://example.com`
3. Click **"Create"**
4. Your entry is now encrypted and stored!

## Troubleshooting

### Database Connection Error

```
Error: database "pswd" does not exist
```

**Solution**: Make sure you created the database:
```bash
createdb pswd
```

### Port Already in Use

```
Error: listen tcp :8080: bind: address already in use
```

**Solution**: Kill the process using port 8080:
```bash
lsof -ti:8080 | xargs kill -9
```

### CORS Error in Browser

```
Access to fetch at 'http://localhost:8080' blocked by CORS policy
```

**Solution**: Make sure the backend is running on port 8080. The CORS settings are configured for `http://localhost:5173`.

### Cannot Find Module Errors

```
Error: Cannot find module '@mui/material'
```

**Solution**: Make sure you ran `bun install`:
```bash
cd frontend
rm -rf node_modules bun.lockb
bun install
```

## Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:8080/api/auth/register
# Should return: "invalid json"
```

### Frontend Build
```bash
cd frontend
bun run build
# Should complete without errors
```

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Check [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for TODOs
- Secure your installation before production use!

## Default Configuration

| Component | Value |
|-----------|-------|
| Backend URL | http://localhost:8080 |
| Frontend URL | http://localhost:5173 |
| Database | pswd |
| DB User | pswd |
| DB Password | pswd |

⚠️ **Change these defaults before deploying to production!**

---

## Quick Links

- **[README.md](README.md)** - Full documentation
- **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Docker setup with pgAdmin
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - One-page cheat sheet
