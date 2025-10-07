package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// NOTE: In a production app, use a proper JWT library like github.com/golang-jwt/jwt
// This is a minimal implementation for demonstration purposes

var jwtSecret = []byte("your-secret-key-change-this-in-production") // TODO: Move to environment variable

type Claims struct {
	UserID    string `json:"user_id"`
	Username  string `json:"username"`
	DeviceID  string `json:"device_id"`
	ExpiresAt int64  `json:"exp"`
}

// GenerateToken creates a JWT token for a user
func GenerateToken(userID, username, deviceID string) (string, error) {
	claims := Claims{
		UserID:    userID,
		Username:  username,
		DeviceID:  deviceID,
		ExpiresAt: time.Now().Add(24 * time.Hour * 30).Unix(), // 30 days
	}

	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	headerJSON, _ := json.Marshal(header)
	claimsJSON, _ := json.Marshal(claims)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	claimsB64 := base64.RawURLEncoding.EncodeToString(claimsJSON)

	message := headerB64 + "." + claimsB64
	signature := sign(message)

	return message + "." + signature, nil
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	message := parts[0] + "." + parts[1]
	signature := parts[2]

	expectedSignature := sign(message)
	if signature != expectedSignature {
		return nil, errors.New("invalid signature")
	}

	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid claims encoding")
	}

	var claims Claims
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, errors.New("invalid claims")
	}

	if time.Now().Unix() > claims.ExpiresAt {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}

func sign(message string) string {
	h := hmac.New(sha256.New, jwtSecret)
	h.Write([]byte(message))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

// ExtractToken extracts the token from the Authorization header or cookie
func ExtractToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("authorization header missing")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", errors.New("invalid authorization header format")
	}

	return parts[1], nil
}

// ExtractTokenFromRequest extracts token from cookie or Authorization header
func ExtractTokenFromRequest(r *http.Request) (string, error) {
	// Try cookie first (preferred method)
	cookie, err := r.Cookie("auth_token")
	if err == nil && cookie.Value != "" {
		return cookie.Value, nil
	}

	// Fallback to Authorization header for backward compatibility
	return ExtractToken(r.Header.Get("Authorization"))
}

// SetAuthCookie sets an HTTP-only secure cookie with the auth token
func SetAuthCookie(w http.ResponseWriter, token string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,                    // Prevents JavaScript access (XSS protection)
		Secure:   false,                   // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,    // CSRF protection
	})
}

// ClearAuthCookie removes the auth cookie
func ClearAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
}

// HashPassword creates a simple hash of the password
// NOTE: In production, use bcrypt or argon2
func HashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password))
	return fmt.Sprintf("%x", h.Sum(nil))
}

// VerifyPassword checks if a password matches the hash
func VerifyPassword(password, hash string) bool {
	return HashPassword(password) == hash
}
