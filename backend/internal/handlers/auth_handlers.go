package handlers

import (
	"backend/pswd/internal/auth"
	"backend/pswd/internal/models"
	"encoding/json"
	"net/http"
)

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
	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "failed to process password", http.StatusInternalServerError)
		return
	}

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
