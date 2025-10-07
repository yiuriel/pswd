# Docker Deployment Guide

This guide explains how to run the entire application stack using Docker.

## 🐳 Quick Start with Docker

```bash
# Build and start all services (backend, frontend, database)
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Services will be available at:**
- **Frontend**: http://localhost:3000 (Docker) or http://localhost:5173 (manual)
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **pgAdmin** (Database UI): http://localhost:5050

## 📦 What's Included

The Docker setup includes:
- **PostgreSQL 16**: Database with automatic initialization
- **Go Backend**: API server with environment configuration
- **React Frontend**: Production build served via Nginx
- **pgAdmin 4**: Web-based database management tool (auto-configured)

## 🛠️ Docker Commands

### Start Services
```bash
docker-compose up
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f pgadmin
```

### Access pgAdmin (Database UI)

1. **Open pgAdmin**: http://localhost:5050
2. **Login credentials**:
   - Email: `admin@admin.com`
   - Password: `admin`
3. **Database already connected!** 
   - Server: "PSWD Vault Database"
   - Click to expand and browse tables

**Browse your data:**
- Click: Servers → PSWD Vault Database → Databases → pswd → Schemas → public → Tables
- Right-click any table → View/Edit Data → All Rows

---

## 📊 pgAdmin Usage Guide

### Common Queries

**View all users:**
```sql
SELECT username, email, created_at FROM users;
```

**Count vault entries per user:**
```sql
SELECT u.username, COUNT(ve.entry_id) as entry_count
FROM users u
LEFT JOIN vault_entries ve ON u.user_id = ve.user_id
GROUP BY u.username;
```

**View recent device activity:**
```sql
SELECT u.username, d.device_name, d.last_seen
FROM devices d
JOIN users u ON d.user_id = u.user_id
ORDER BY d.last_seen DESC;
```

**Check table sizes:**
```sql
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.' || tablename))
FROM pg_tables WHERE schemaname = 'public';
```

### Rebuild After Code Changes
```bash
docker-compose up --build
```

### Reset Everything (including database)
```bash
docker-compose down -v
docker-compose up --build
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example
cp .env.example .env

# Edit with your values
nano .env
```

**Important variables:**
- `JWT_SECRET`: Change this in production!
- `DB_PASSWORD`: Change this in production!

### Production Configuration

For production deployment:

1. **Update JWT Secret**:
```bash
# Generate a secure random secret
openssl rand -base64 32
```

2. **Update Database Password**:
```bash
# Use a strong password
openssl rand -base64 24
```

3. **Update docker-compose.yml**:
   - Remove port mappings for database (only backend needs access)
   - Add restart policies
   - Consider using Docker secrets

## 📁 Volume Management

### Data Persistence

Database data is stored in a Docker volume:
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect pswd_postgres_data

# Backup database
docker exec pswd-db pg_dump -U pswd pswd > backup.sql

# Restore database
docker exec -i pswd-db psql -U pswd pswd < backup.sql
```

### Remove All Data
```bash
docker-compose down -v
```

## 🌐 Network Architecture

```
┌─────────────────┐       ┌─────────────────┐
│   Browser       │       │   pgAdmin UI    │
│  localhost:3000 │       │  localhost:5050 │
└────────┬────────┘       └────────┬────────┘
         │                         │
    ┌────▼─────┐              ┌────▼─────┐
    │ Frontend │              │ pgAdmin  │
    │  Nginx   │              │ Container│
    └────┬─────┘              └────┬─────┘
         │                         │
    ┌────▼─────────┐               │
    │   Backend    │               │
    │   Go API     │               │
    │  Port 8080   │               │
    └────┬─────────┘               │
         │                         │
         └─────────┬───────────────┘
                   │
            ┌──────▼────────┐
            │  PostgreSQL   │
            │   Database    │
            │   Port 5432   │
            └───────────────┘
```

All services communicate via the `pswd-network` bridge network.

## 🔒 Security Considerations

### Development vs Production

**Development** (current setup):
- Ports exposed for debugging
- Default credentials
- Debug logging enabled

**Production** (recommended changes):

1. **Use secrets management**:
```yaml
services:
  backend:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

2. **Add HTTPS**:
   - Use a reverse proxy (Nginx, Traefik, Caddy)
   - Install SSL certificates (Let's Encrypt)

3. **Restrict database access**:
```yaml
services:
  db:
    # Remove ports section - only backend needs access
```

4. **Add health checks**:
```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

5. **Resource limits**:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## 🚀 Production Deployment

### Using Docker Compose in Production

```bash
# Production docker-compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

Convert to Kubernetes manifests:
```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert -f docker-compose.yml
```

## 🐛 Troubleshooting

### Backend Can't Connect to Database

**Error**: `dial tcp: lookup db: no such host`

**Solution**: Ensure services are on the same network:
```bash
docker-compose down
docker-compose up
```

### Frontend Shows "Connection Refused"

**Check backend is running**:
```bash
docker-compose logs backend
curl http://localhost:8080/api/user/me
```

### Database Connection Issues

**Check database is ready**:
```bash
docker-compose exec db psql -U pswd -d pswd -c "SELECT 1;"
```

**Or use pgAdmin UI**:
1. Open http://localhost:5050
2. Login with `admin@admin.com` / `admin`
3. Click on "PSWD Vault Database"
4. Navigate to Tools → Query Tool
5. Run test query: `SELECT 1;`

### pgAdmin Issues

**Can't access pgAdmin UI**:
```bash
# Check if container is running
docker-compose ps pgadmin

# View logs
docker-compose logs pgadmin

# Restart pgAdmin
docker-compose restart pgadmin
```

**Database not showing in pgAdmin**:
- The database is auto-configured via `pgadmin-servers.json`
- If not visible, manually add:
  - Host: `db` (not localhost!)
  - Port: `5432`
  - Database: `pswd`
  - Username: `pswd`
  - Password: `pswd`

### Port Already in Use

**Error**: `bind: address already in use`

**Solution**:
```bash
# Find process using port
lsof -ti:8080 | xargs kill -9
# Or change port in docker-compose.yml
```

## 📊 Monitoring

### Container Stats
```bash
docker stats
```

### Database Queries
```bash
# Connect to database
docker-compose exec db psql -U pswd -d pswd

# Check active connections
SELECT * FROM pg_stat_activity;

# Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname='public';
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build images
        run: docker-compose build
      
      - name: Push to registry
        run: |
          docker tag pswd-backend:latest registry.example.com/pswd-backend:${{ github.sha }}
          docker push registry.example.com/pswd-backend:${{ github.sha }}
```

## 📝 Notes

- The backend automatically creates database tables on first run
- Frontend is built as a static site and served by Nginx
- Database data persists across container restarts
- Logs are stored in Docker's logging system

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify services are running: `docker-compose ps`
3. Check network: `docker network inspect pswd_pswd-network`
4. Restart services: `docker-compose restart`

For more help, see the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md).
