# Implementation Notes & Production TODOs

> **Quick Links**: [README](README.md) | [Quick Reference](QUICK_REFERENCE.md) | [Docker Guide](DOCKER_GUIDE.md)

### Backend (Go)

1. **Database Schema** (`backend/cmd/server/main.go`)
   - Users table with encryption keys and master device flag
{{ ... }}
   - Devices table with fingerprinting and master device designation
   - Vault entries table for encrypted password storage
   - PostgreSQL with automatic schema initialization

2. **Authentication System** (`backend/internal/auth/jwt.go`)
   - JWT token generation and validation
   - Password hashing (basic SHA-256 - see TODO below)
   - Device fingerprint verification
   - Authorization middleware

3. **API Handlers** (`backend/internal/handlers/handlers.go`)
   - User registration with master device setup
   - Login with device verification
   - CRUD operations for vault entries
   - User info endpoint

### Frontend (React + TypeScript)

1. **Crypto Utilities** (`frontend/src/helpers/crypto.ts`)
   - Master key generation (X25519 encryption, Ed25519 signing)
   - Device key generation and fingerprinting
   - Symmetric encryption/decryption for vault entries
   - Secure password generator
   - Key storage in localStorage

2. **Registration Flow** (`frontend/src/components/auth/RegisterWithSteps.tsx`)
   - Step-by-step visual feedback during registration
   - Automatic key generation and storage
   - Master device designation
   - Account creation with encrypted keys

3. **Login System** (`frontend/src/components/auth/LoginUpdated.tsx`)
   - Device fingerprint verification
   - Master device check
   - Session management with JWT

4. **Vault Manager** (`frontend/src/views/VaultManager.tsx`)
   - Add, view, edit, delete vault entries
   - Client-side encryption before storage
   - Password visibility toggle
   - Copy to clipboard functionality
   - Secure password generation

5. **Home Page** (`frontend/src/views/Home.tsx`)
   - Feature showcase
   - Master device status indicator
   - Usage instructions

## ⚠️ TODO: Steps That Need Manual Implementation

### Critical Security Improvements (Production)

#### 1. Backend Password Hashing
**Location**: `backend/internal/auth/jwt.go`
**Current**: Using SHA-256 (NOT SECURE for passwords)
**TODO**: 
```go
// Replace the HashPassword function with bcrypt or argon2
import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

func VerifyPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

#### 2. JWT Secret Management
**Location**: `backend/internal/auth/jwt.go`
**Current**: Hardcoded secret
**TODO**:
```go
// Move to environment variable
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

// Add validation in main.go
if os.Getenv("JWT_SECRET") == "" {
    log.Fatal("JWT_SECRET environment variable must be set")
}
```

#### 3. Secure Key Storage (Frontend)
**Location**: `frontend/src/helpers/crypto.ts` - `storeMasterKeys()` function
**Current**: Using localStorage (vulnerable to XSS)
**TODO**: Implement one of these approaches:

**Option A: IndexedDB with encryption**
```typescript
// Use IndexedDB to store encrypted keys
// Library: idb or Dexie.js
import { openDB } from 'idb';

async function storeMasterKeysSecure(encKey: string, signKey: string, deviceKey: string) {
    const db = await openDB('VaultDB', 1, {
        upgrade(db) {
            db.createObjectStore('keys');
        },
    });
    
    // TODO: Encrypt these keys with a key derived from user password
    // using PBKDF2 or argon2
    await db.put('keys', encKey, 'master_enc_sk');
    await db.put('keys', signKey, 'master_sign_sk');
    await db.put('keys', deviceKey, 'device_sk');
}
```

**Option B: Web Crypto API**
```typescript
// Use Web Crypto API to store keys
// This requires converting the keys to CryptoKey objects
// and using the SubtleCrypto interface
async function storeKeysInWebCrypto() {
    // TODO: Implement using crypto.subtle.importKey()
    // and storing with extractable: false
}
```

#### 4. Key Backup and Recovery
**Location**: Needs new implementation
**TODO**: Create a secure backup mechanism
```typescript
// frontend/src/helpers/keyBackup.ts
export async function generateRecoveryPhrase(): Promise<string> {
    // TODO: Generate BIP39 mnemonic phrase
    // Use: bip39 library
    // Store encrypted master keys that can be recovered with this phrase
}

export async function recoverFromPhrase(phrase: string): Promise<Keys> {
    // TODO: Derive keys from mnemonic
    // Validate phrase
    // Restore master keys
}
```

#### 5. Multi-Device Authorization
**Location**: Needs new implementation in backend and frontend
**TODO**: Implement device authorization flow

**Backend** (`backend/internal/handlers/handlers.go`):
```go
// Add new endpoint for device authorization request
func (h *Handler) RequestDeviceAuthHandler(w http.ResponseWriter, r *http.Request) {
    // TODO:
    // 1. Generate authorization code
    // 2. Store in pending_authorizations table with expiry
    // 3. Return code to requesting device
}

func (h *Handler) ApproveDeviceHandler(w http.ResponseWriter, r *http.Request) {
    // TODO:
    // 1. Master device approves authorization code
    // 2. Encrypt vault master key with new device's public key
    // 3. Store new device in devices table
    // 4. Return encrypted master key to new device
}
```

**Frontend**:
```typescript
// frontend/src/components/DeviceAuthorization.tsx
// TODO: Create UI for:
// 1. Generating QR code with authorization request
// 2. Master device scanning and approving
// 3. Key exchange using device public keys
```

#### 6. Database Connection Pooling
**Location**: `backend/cmd/server/main.go`
**TODO**:
```go
// Configure connection pooling
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(1 * time.Minute)

// Add health check
if err := db.Ping(); err != nil {
    log.Fatal("Database connection failed:", err)
}
```

#### 7. Rate Limiting
**Location**: `backend/cmd/server/main.go`
**TODO**: Add rate limiting middleware
```go
import "github.com/didip/tollbooth/v7"

// Add to router
limiter := tollbooth.NewLimiter(10, nil) // 10 requests per second
r.Use(tollbooth.LimitHandler(limiter))

// Or per-route
r.With(tollbooth.LimitHandler(limiter)).Post("/api/auth/login", h.LoginHandler)
```

#### 8. HTTPS/TLS
**Location**: `backend/cmd/server/main.go`
**TODO**: Replace HTTP with HTTPS
```go
// Generate certificates (for development):
// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

log.Println("🚀 Server running on https://localhost:8080")
if err := http.ListenAndServeTLS(":8080", "cert.pem", "key.pem", r); err != nil {
    log.Fatal(err)
}
```

#### 9. Input Validation
**Location**: All handlers in `backend/internal/handlers/handlers.go`
**TODO**: Add comprehensive validation
```go
import "github.com/go-playground/validator/v10"

type RegisterRequest struct {
    Username  string `json:"username" validate:"required,min=3,max=50,alphanum"`
    Email     string `json:"email" validate:"required,email"`
    Password  string `json:"password" validate:"required,min=8"`
    // ... other fields
}

var validate = validator.New()

func validateRequest(req interface{}) error {
    return validate.Struct(req)
}
```

#### 10. Session Management
**Location**: Frontend - needs new implementation
**TODO**: Add refresh tokens and session timeout
```typescript
// frontend/src/helpers/auth.ts
export async function refreshAccessToken(): Promise<string> {
    // TODO: Implement refresh token flow
    // Store refresh token separately
    // Call backend refresh endpoint
    // Update access token
}

// Add automatic refresh before token expiry
setInterval(async () => {
    const token = localStorage.getItem('authToken');
    if (token && isTokenExpiringSoon(token)) {
        await refreshAccessToken();
    }
}, 60000); // Check every minute
```

### Nice-to-Have Features

#### 11. Password Strength Indicator
**Location**: `frontend/src/components/auth/RegisterWithSteps.tsx`
**TODO**: Add zxcvbn library
```typescript
import zxcvbn from 'zxcvbn';

function PasswordStrengthIndicator({ password }: { password: string }) {
    const result = zxcvbn(password);
    // TODO: Display strength bar and suggestions
}
```

#### 12. Audit Logging
**Location**: Backend - needs new table and handlers
**TODO**: Create audit log
```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

#### 13. Vault Import/Export
**Location**: Frontend - needs new component
**TODO**: Create import/export functionality
```typescript
// frontend/src/helpers/vaultExport.ts
export async function exportVault(): Promise<Blob> {
    // TODO: Fetch all entries
    // Keep them encrypted
    // Add metadata
    // Create encrypted JSON file
}

export async function importVault(file: File): Promise<void> {
    // TODO: Read file
    // Validate format
    // Re-encrypt with current keys if needed
    // Upload to server
}
```

## 🔧 Deployment Checklist

Before deploying to production:

- [ ] Replace SHA-256 password hashing with bcrypt/argon2
- [ ] Move secrets to environment variables
- [ ] Implement proper JWT library
- [ ] Add HTTPS/TLS certificates
- [ ] Configure database connection pooling
- [ ] Add rate limiting
- [ ] Implement comprehensive input validation
- [ ] Set up proper logging (structured logs)
- [ ] Configure CORS properly (not wildcard)
- [ ] Add monitoring and alerting
- [ ] Set up automated backups
- [ ] Implement key backup/recovery mechanism
- [ ] Add session timeout and refresh tokens
- [ ] Review and harden security headers
- [ ] Perform security audit
- [ ] Load testing

## 📝 Testing Recommendations

### Backend Tests Needed
```go
// backend/internal/auth/jwt_test.go
func TestTokenGeneration(t *testing.T) { /* TODO */ }
func TestTokenValidation(t *testing.T) { /* TODO */ }
func TestPasswordHashing(t *testing.T) { /* TODO */ }

// backend/internal/handlers/handlers_test.go
func TestRegisterHandler(t *testing.T) { /* TODO */ }
func TestLoginHandler(t *testing.T) { /* TODO */ }
func TestVaultOperations(t *testing.T) { /* TODO */ }
```

### Frontend Tests Needed
```typescript
// frontend/src/helpers/crypto.test.ts
describe('Crypto', () => {
    test('should generate valid keypairs', () => { /* TODO */ });
    test('should encrypt and decrypt correctly', () => { /* TODO */ });
});

// frontend/src/components/auth/RegisterWithSteps.test.tsx
describe('Registration Flow', () => {
    test('should complete all steps successfully', () => { /* TODO */ });
});
```

## 🎯 Current Limitations

1. **Single Master Device**: Only one device can be master. Multi-device sync not implemented.
2. **No Key Recovery**: Lost keys = lost vault. Backup mechanism needed.
3. **localStorage**: Keys stored in localStorage are vulnerable to XSS attacks.
4. **No Offline Mode**: Requires server connection for all operations.
5. **Basic JWT**: Simple JWT implementation, no rotation or blacklisting.
6. **No 2FA**: Two-factor authentication not implemented.
7. **No Sharing**: Can't share vault entries with other users.
8. **No Password History**: Previous passwords not tracked.
9. **No Breach Detection**: Not checking against compromised password databases.
10. **No Browser Extension**: Manual copy-paste required.

## 📚 Additional Resources

- **Cryptography**: [Libsodium Docs](https://libsodium.gitbook.io/)
- **JWT Security**: [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- **OWASP**: [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/)
- **Go Security**: [Secure Coding Practices](https://github.com/OWASP/Go-SCP)
