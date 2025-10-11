package handlers

import (
	"backend/pswd/internal/models"
	"encoding/json"
	"net/http"
)

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

// EraseDBDataHandler resets the database (admin/dev only)
func (h *Handler) EraseDBDataHandler(w http.ResponseWriter, r *http.Request) {
	_, err := h.DB.Exec(`
		TRUNCATE TABLE users CASCADE;
		TRUNCATE TABLE devices CASCADE;
		TRUNCATE TABLE vaults CASCADE;
		TRUNCATE TABLE vault_entries CASCADE;
	`)
	if err != nil {
		http.Error(w, "failed to erase database data", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
