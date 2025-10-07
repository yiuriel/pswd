# Secure Vault Storage

A decentralized password manager with master device architecture. Built with end-to-end encryption where your private keys never leave your device.

## 🔐 Features

- **End-to-End Encryption**: All data encrypted locally using libsodium (NaCl) before transmission
- **Master Device Architecture**: Designate one device as the primary vault controller
- **Client-Side Keys**: Private keys stored only on your master device, never on the server
- **Device Fingerprinting**: Secure device registration and authentication
- **JWT Authentication**: Secure session management
- **Modern UI**: Clean, responsive interface with step-by-step visual feedback

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **UI Library**: Material-UI (MUI) v7
- **Crypto**: libsodium-wrappers for encryption/decryption
- **Routing**: React Router v7
- **Build Tool**: Vite

### Backend (Go + PostgreSQL)
- **Language**: Go 1.25+
- **Framework**: Chi router
- **Database**: PostgreSQL with pgcrypto extension
- **Authentication**: Custom JWT implementation (production should use a proper JWT library)

## 📋 Prerequisites

- **Bun**: Latest (for frontend) - Install from https://bun.sh
- **Go**: 1.25+ (for backend)
- **PostgreSQL**: 14+ (for database)

## 🚀 Quick Start

You have **THREE** ways to start the application:

### Option 1: Automatic Script (Easiest)
```bash
./start.sh
```
Opens backend and frontend in separate terminal tabs automatically.

### Option 2: Docker Compose (Best for Production)
```bash
docker-compose up --build
```
Starts everything (database, backend, frontend, pgAdmin) in containers.
- **Frontend**: http://localhost:5173 (dev) or http://localhost:3000 (Docker)
- **pgAdmin**: http://localhost:5050 (DB visualization)

### Option 3: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
go run cmd/server/main.go

# Terminal 2 - Frontend
cd frontend
bun run dev
```
Access at http://localhost:5173

📖 **Detailed guides**: [QUICKSTART.md](QUICKSTART.md) | [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

## 🎯 Usage

### First Time Setup (Master Device)

1. **Navigate** to `http://localhost:5173`
2. **Click "Create Vault"**
3. **Fill in the registration form**:
   - Username (unique identifier)
   - Email
   - Password (8+ chars with uppercase, lowercase, and numbers)
   - Device Name (e.g., "MacBook Pro")
4. **Watch the setup process**:
   - ✓ Initialize cryptography libraries
   - ✓ Generate master encryption keys (X25519 & Ed25519)
   - ✓ Register master device
   - ✓ Store keys securely in browser
   - ✓ Create account on server
5. **Start using your vault** - you'll be redirected automatically

### Adding Vault Entries

1. **Open Vault** from the home page
2. **Click "Add Entry"**
3. **Fill in entry details**:
   - Title (e.g., "Gmail Account")
   - Username/Email
   - Password (use the generate button for secure passwords)
   - Website URL (optional)
   - Notes (optional)
4. **Save** - data is encrypted before storage

### Viewing Entries

- **Click "Decrypt to View"** on any entry card
- **Copy passwords** using the copy icon
- **Toggle visibility** with the eye icon
- **Edit or delete** entries via the menu (⋮)

## 🔒 Security Model

### Encryption Flow

1. **Key Generation**:
   - Master encryption keypair (X25519) for asymmetric encryption
   - Signing keypair (Ed25519) for authentication
   - Device-specific keypair for device management

2. **Data Encryption**:
   - Vault entries encrypted with symmetric key derived from master key
   - Uses `crypto_secretbox_easy` (XSalsa20-Poly1305)
   - Nonce prepended to ciphertext

3. **Storage** (⚡ **NEW: Secure Storage Implementation**):
   - **Client**: Private keys in **IndexedDB with encryption** (session-based)
   - **Fallback**: localStorage if IndexedDB unavailable
   - **Server**: Only encrypted data and public keys
   - 📖 Details: [STORAGE_SECURITY.md](STORAGE_SECURITY.md)

### What the Server Knows

- ✅ Username and email
- ✅ Public encryption keys
- ✅ Encrypted vault data (cannot decrypt)
- ✅ Device fingerprints
- ❌ **Never** sees: Private keys, plaintext passwords, decrypted data

## 🛠️ API Endpoints

### Public Endpoints

```
POST /api/auth/register     - Register new user and master device
POST /api/auth/login        - Login with username and password
```

### Protected Endpoints (require JWT token)

```
GET  /api/user/me                     - Get current user info
GET  /api/vault/entries               - List all vault entries
POST /api/vault/entries               - Create new entry
PUT  /api/vault/entries/{entryID}     - Update entry
DELETE /api/vault/entries/{entryID}   - Delete entry
```

## ⚠️ Production Considerations

This is a demonstration/educational project. For production use, address these items:

### Backend

1. **JWT Library**: Replace custom JWT with `github.com/golang-jwt/jwt`
2. **Password Hashing**: Use bcrypt or argon2 instead of SHA-256
3. **Environment Variables**: Move secrets to environment variables
4. **HTTPS**: Use TLS/SSL certificates
5. **Rate Limiting**: Add rate limiting middleware
6. **Input Validation**: More robust validation and sanitization
7. **Logging**: Add structured logging
8. **Error Handling**: Improve error messages (don't leak internal details)

### Frontend

1. **Secure Storage**: Use IndexedDB with encryption or Web Crypto API
2. **Key Backup**: Implement secure key backup/recovery mechanism
3. **Session Management**: Add session timeout and refresh tokens
4. **CSP Headers**: Implement Content Security Policy
5. **Multi-Device**: Add secure device authorization flow
6. **Key Rotation**: Implement key rotation mechanism

### Database
1. **Migrations**: Use proper database migration tool
2. **Backups**: Implement automated encrypted backups
3. **Connection Pooling**: Configure connection pooling
4. **Indexes**: Add appropriate indexes for performance

## 📁 Project Structure

```
pswd/
├── backend/
│   ├── cmd/server/main.go                    - Main server entry point
│   └── internal/
│       ├── auth/jwt.go                       - JWT token management
│       ├── handlers/handlers.go              - HTTP request handlers
│       └── models/models.go                  - Data models and DTOs
├── frontend/
│   └── src/
│       ├── components/auth/
│       │   ├── RegisterWithSteps.tsx         - Registration with visual steps
│       │   └── LoginUpdated.tsx              - Login component
│       ├── views/
│       │   ├── Home.tsx                      - Landing page
│       │   └── VaultManager.tsx              - Main vault interface
│       └── helpers/
│           ├── crypto.ts                     - Encryption utilities
│           ├── secureStorage.ts              - IndexedDB secure storage
│           └── api.ts                        - API client functions
├── start.sh                                  - Automatic startup script
├── reset_db.sh                               - Database reset utility
├── docker-compose.yml                        - Docker orchestration
├── Dockerfile.backend                        - Backend container
├── Dockerfile.frontend                       - Frontend container
└── Documentation/
    ├── README.md                             - This file (start here!)
    ├── QUICKSTART.md                         - 5-minute setup guide
    ├── DOCKER_GUIDE.md                       - Docker + pgAdmin guide
    ├── QUICK_REFERENCE.md                    - One-page cheat sheet
    ├── STORAGE_SECURITY.md                   - Security deep-dive
    └── IMPLEMENTATION_NOTES.md               - TODOs & production checklist

## 🎓 Learning Resources

- [libsodium Documentation](https://libsodium.gitbook.io/)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## 📝 TODO / Future Enhancements

- [ ] Implement secure key backup and recovery
- [ ] Add multi-device authorization flow
- [ ] Implement 2FA (TOTP)
- [ ] Add password strength indicator
- [ ] Implement password breach checking (Have I Been Pwned API)
- [ ] Add vault import/export (encrypted)
- [ ] Implement sharing mechanism (with re-encryption)
- [ ] Add browser extension
- [ ] Mobile app (React Native)

## 📄 License

MIT

## 👥 Contributing

This is an educational project. Feel free to fork and experiment!
