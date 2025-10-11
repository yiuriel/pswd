package models

import "time"

// VaultEntry represents an individual vault entry (password, note, etc.)
type VaultEntry struct {
	EntryID       string    `json:"entry_id" db:"entry_id"`
	UserID        string    `json:"user_id" db:"user_id"`
	Title         string    `json:"title" db:"title"`
	EncryptedData []byte    `json:"encrypted_data" db:"encrypted_data"`
	EntryType     string    `json:"entry_type" db:"entry_type"` // "password", "note", "card", etc.
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}
