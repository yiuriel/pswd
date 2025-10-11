package handlers

import (
	"backend/pswd/internal/models"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

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
