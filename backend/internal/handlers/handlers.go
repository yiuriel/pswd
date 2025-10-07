package handlers

import (
	"backend/pswd/internal/auth"
	"backend/pswd/internal/models"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	DB *sql.DB
}

// RegisterHandler handles user registration with master device setup
func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Username == "" || req.Password == "" || req.DeviceFingerprint == "" {
		http.Error(w, "username, password, and device_fingerprint are required", http.StatusBadRequest)
		return
	}

	// Hash password
	passwordHash := auth.HashPassword(req.Password)

	// Start transaction
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Insert user
	var userID string
	err = tx.QueryRow(`
		INSERT INTO users (username, email, pk_encrypt, pk_sign, password_hash, is_master_device_registered)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING user_id`,
		req.Username, req.Email, req.PkEncrypt, req.PkSign, passwordHash,
	).Scan(&userID)

	if err != nil {
		http.Error(w, "username or email already exists", http.StatusConflict)
		return
	}

	// Register master device
	var deviceID string
	err = tx.QueryRow(`
		INSERT INTO devices (user_id, device_name, device_fingerprint, pk_device, is_master)
		VALUES ($1, $2, $3, $4, true)
		RETURNING device_id`,
		userID, req.DeviceName, req.DeviceFingerprint, req.PkDevice,
	).Scan(&deviceID)

	if err != nil {
		http.Error(w, "failed to register device", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "failed to complete registration", http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(userID, req.Username, deviceID)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	// Set HTTP-only secure cookie
	auth.SetAuthCookie(w, token, 60*60*24*30) // 30 days

	resp := models.RegisterResponse{
		UserID:   userID,
		Username: req.Username,
		Token:    token, // Still send in response for backward compatibility
		DeviceID: deviceID,
		IsMaster: true,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// LoginHandler handles user login
func (h *Handler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	// Get user
	var userID, username, passwordHash string
	err := h.DB.QueryRow(`
		SELECT user_id, username, password_hash
		FROM users
		WHERE username = $1`,
		req.Username,
	).Scan(&userID, &username, &passwordHash)

	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Verify password
	if !auth.VerifyPassword(req.Password, passwordHash) {
		http.Error(w, "invalid password", http.StatusUnauthorized)
		return
	}

	// Check if device exists
	var deviceID string
	var isMaster bool
	err = h.DB.QueryRow(`
		SELECT device_id, is_master
		FROM devices
		WHERE user_id = $1 AND device_fingerprint = $2`,
		userID, req.DeviceFingerprint,
	).Scan(&deviceID, &isMaster)

	if err != nil {
		// Device not registered - this should prompt device registration flow
		http.Error(w, "device not registered", http.StatusForbidden)
		return
	}

	// Update last seen
	_, err = h.DB.Exec(`
		UPDATE devices SET last_seen = now() WHERE device_id = $1`,
		deviceID,
	)

	// Generate token
	token, err := auth.GenerateToken(userID, username, deviceID)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	// Set HTTP-only secure cookie
	auth.SetAuthCookie(w, token, 60*60*24*30) // 30 days

	resp := models.LoginResponse{
		UserID:   userID,
		Username: username,
		Token:    token, // Still send in response for backward compatibility
		DeviceID: deviceID,
		IsMaster: isMaster,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// LogoutHandler clears the authentication cookie
func (h *Handler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Clear the auth cookie
	auth.ClearAuthCookie(w)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "logged out successfully"})
}

// AuthMiddleware validates JWT tokens from cookie or header
func (h *Handler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from cookie or Authorization header
		tokenString, err := auth.ExtractTokenFromRequest(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Add claims to context
		ctx := r.Context()
		ctx = setUserID(ctx, claims.UserID)
		ctx = setDeviceID(ctx, claims.DeviceID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CreateVaultEntryHandler creates a new vault entry
func (h *Handler) CreateVaultEntryHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r.Context())

	var req models.VaultEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	// Decode base64 encrypted data
	encryptedData, err := base64.StdEncoding.DecodeString(req.EncryptedData)
	if err != nil {
		http.Error(w, "invalid encrypted data", http.StatusBadRequest)
		return
	}

	var entryID string
	err = h.DB.QueryRow(`
		INSERT INTO vault_entries (user_id, title, encrypted_data, entry_type)
		VALUES ($1, $2, $3, $4)
		RETURNING entry_id`,
		userID, req.Title, encryptedData, req.EntryType,
	).Scan(&entryID)

	if err != nil {
		http.Error(w, "failed to create entry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"entry_id": entryID})
}

// GetVaultEntriesHandler retrieves all vault entries for a user
func (h *Handler) GetVaultEntriesHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r.Context())

	rows, err := h.DB.Query(`
		SELECT entry_id, title, encrypted_data, entry_type, created_at, updated_at
		FROM vault_entries
		WHERE user_id = $1
		ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entries []models.VaultEntryResponse
	for rows.Next() {
		var entry models.VaultEntryResponse
		var encryptedData []byte

		err := rows.Scan(&entry.EntryID, &entry.Title, &encryptedData,
			&entry.EntryType, &entry.CreatedAt, &entry.UpdatedAt)
		if err != nil {
			continue
		}

		entry.EncryptedData = base64.StdEncoding.EncodeToString(encryptedData)
		entries = append(entries, entry)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

// UpdateVaultEntryHandler updates an existing vault entry
func (h *Handler) UpdateVaultEntryHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r.Context())
	entryID := chi.URLParam(r, "entryID")

	var req models.VaultEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	encryptedData, err := base64.StdEncoding.DecodeString(req.EncryptedData)
	if err != nil {
		http.Error(w, "invalid encrypted data", http.StatusBadRequest)
		return
	}

	result, err := h.DB.Exec(`
		UPDATE vault_entries
		SET title = $1, encrypted_data = $2, entry_type = $3, updated_at = now()
		WHERE entry_id = $4 AND user_id = $5`,
		req.Title, encryptedData, req.EntryType, entryID, userID,
	)

	if err != nil {
		http.Error(w, "failed to update entry", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "entry not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteVaultEntryHandler deletes a vault entry
func (h *Handler) DeleteVaultEntryHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r.Context())
	entryID := chi.URLParam(r, "entryID")

	result, err := h.DB.Exec(`
		DELETE FROM vault_entries
		WHERE entry_id = $1 AND user_id = $2`,
		entryID, userID,
	)

	if err != nil {
		http.Error(w, "failed to delete entry", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "entry not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetUserInfoHandler returns current user information
func (h *Handler) GetUserInfoHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r.Context())

	var user models.User
	err := h.DB.QueryRow(`
		SELECT user_id, username, email, pk_encrypt, pk_sign, is_master_device_registered, created_at
		FROM users
		WHERE user_id = $1`,
		userID,
	).Scan(&user.UserID, &user.Username, &user.Email, &user.PkEncrypt,
		&user.PkSign, &user.IsMasterDeviceRegistered, &user.CreatedAt)

	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Context helpers
type contextKey string

const (
	userIDKey   contextKey = "userID"
	deviceIDKey contextKey = "deviceID"
)

func setUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func getUserID(ctx context.Context) string {
	if userID, ok := ctx.Value(userIDKey).(string); ok {
		return userID
	}
	return ""
}

func setDeviceID(ctx context.Context, deviceID string) context.Context {
	return context.WithValue(ctx, deviceIDKey, deviceID)
}

func getDeviceID(ctx context.Context) string {
	if deviceID, ok := ctx.Value(deviceIDKey).(string); ok {
		return deviceID
	}
	return ""
}
