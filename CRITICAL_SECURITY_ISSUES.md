# 🚨 Critical Security Issues

## 1. **JWT Secret Hardcoded (SEVERITY: CRITICAL)**
**Location:** `/backend/internal/auth/jwt.go:20`
```go
var jwtSecret = []byte("your-secret-key-change-this-in-production") // TODO: Move to environment variable
```

**Risk:** Anyone with this secret can forge authentication tokens for any user.

**Fix Required:**
- Move to environment variable immediately
- Generate a cryptographically secure random secret (min 256 bits)
- Never commit the actual secret to version control
- Rotate secrets periodically in production

```go
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
    if len(jwtSecret) == 0 {
        log.Fatal("JWT_SECRET environment variable is required")
    }
    if len(jwtSecret) < 32 {
        log.Fatal("JWT_SECRET must be at least 32 bytes")
    }
}
```

---

## 2. **CORS Configuration Too Permissive (SEVERITY: HIGH)**
**Location:** `/backend/cmd/server/main.go:52-59`
```go
AllowedOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
```

**Risk:** In production, this needs to be strictly controlled.

**Fix Required:**
- Use environment variable for allowed origins
- Never use wildcards (`*`) in production
- Implement proper origin validation

```go
allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
if len(allowedOrigins) == 0 {
    allowedOrigins = []string{"https://yourdomain.com"}
}
```

---

## 3. **Insecure Cookie Settings (SEVERITY: HIGH)**
**Location:** `/backend/internal/auth/jwt.go:127`
```go
Secure: false,  // Set to true in production with HTTPS
```

**Risk:** Cookies can be intercepted over HTTP, allowing session hijacking.

**Fix Required:**
```go
Secure: os.Getenv("ENV") == "production",
SameSite: http.SameSiteStrictMode, // Change from Lax to Strict
```

---

## 4. **SQL Injection Vulnerability Potential (SEVERITY: MEDIUM)**
**Location:** Throughout handlers

**Current State:** Using `$1, $2` placeholders ✅ (Good!)
**Risk:** Low currently, but must maintain this practice.

**Recommendation:** Consider using an ORM or query builder like `sqlx` or `gorm` for additional safety.

---

## 5. **No Rate Limiting (SEVERITY: HIGH)**
**Missing:** Login/register endpoints have no rate limiting.

**Risk:** Brute force attacks on passwords and username enumeration.

**Fix Required:**
```go
import "golang.org/x/time/rate"

// In middleware
limiter := rate.NewLimiter(5, 10) // 5 req/sec, burst of 10
if !limiter.Allow() {
    http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
    return
}
```

---

## 6. **Username Enumeration (SEVERITY: MEDIUM)**
**Location:** Login returns different errors for "user not found" vs "invalid password"

**Risk:** Attackers can enumerate valid usernames.

**Fix:** Always return generic "invalid credentials" message.

```go
if err != nil || !auth.VerifyPassword(req.Password, passwordHash) {
    http.Error(w, "invalid credentials", http.StatusUnauthorized)
    return
}
```

---

## 7. **Missing Input Validation (SEVERITY: MEDIUM)**
**Location:** Throughout handlers

**Missing:**
- Email format validation (backend)
- Username length/character restrictions
- Password complexity enforcement (backend)
- Device fingerprint validation

**Fix:** Add validation layer:
```go
func validateEmail(email string) error {
    if !emailRegex.MatchString(email) {
        return errors.New("invalid email format")
    }
    return nil
}
```

---

## 8. **No CSRF Protection (SEVERITY: MEDIUM)**
**Current:** SameSite cookies provide some protection, but not sufficient.

**Fix Required:**
- Implement CSRF token validation for state-changing operations
- Use double-submit cookie pattern or synchronizer tokens

---

## 9. **Device Fingerprint Weakness (SEVERITY: MEDIUM)**
**Location:** `/frontend/src/helpers/SecureCrypto.ts:247-268`

**Issues:**
- Includes random component → not deterministic across sessions
- Easily spoofed
- Not cryptographically secure

**Fix:**
```typescript
async generateDeviceFingerprint(): Promise<string> {
    // Try to get stored fingerprint FIRST
    const stored = await this.storage.get("device_fingerprint");
    if (stored) return stored;
    
    // Only generate once and persist
    const components = [
        nav.userAgent,
        nav.language,
        screen.colorDepth.toString(),
        screen.width + "x" + screen.height,
        new Date().getTimezoneOffset().toString(),
        // Remove random component for consistency
    ];
    
    // Use crypto hash instead of btoa
    const data = new TextEncoder().encode(components.join("|"));
    const hash = await crypto.subtle.digest('SHA-256', data);
    const fingerprint = sodium.to_base64(new Uint8Array(hash));
    
    await this.storage.set("device_fingerprint", fingerprint);
    return fingerprint;
}
```

---

## 10. **Master Key Recovery Not Implemented (SEVERITY: CRITICAL)**
**Missing:** If user loses master device, they lose ALL data.

**Fix Required:**
- Implement recovery key generation during registration
- Store recovery key encrypted with user password
- Implement key escrow or backup mechanism
- Consider multi-signature recovery requiring multiple devices
