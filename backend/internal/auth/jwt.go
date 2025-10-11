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

	"golang.org/x/crypto/bcrypt"
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

// HashPassword hashes a password using bcrypt with a cost of 12.
// Returns the bcrypt hash string or an error if hashing fails.
// Cost of 12 provides a good balance between security and performance.
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}

	// Use bcrypt with cost factor 12 (recommended for production)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

// VerifyPassword checks if a password matches the bcrypt hash.
// Returns true if the password is correct, false otherwise.
// Uses constant-time comparison to prevent timing attacks.
func VerifyPassword(password, hash string) bool {
	if password == "" || hash == "" {
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
