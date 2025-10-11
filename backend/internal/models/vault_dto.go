package models

import "time"

// VaultEntryRequest contains the data needed to create or update a vault entry
type VaultEntryRequest struct {
	Title         string `json:"title"`
	EncryptedData string `json:"encrypted_data"` // Base64 encoded
	EntryType     string `json:"entry_type"`
}

// VaultEntryResponse contains the vault entry data returned to the client
type VaultEntryResponse struct {
	EntryID       string    `json:"entry_id"`
	Title         string    `json:"title"`
	EncryptedData string    `json:"encrypted_data"` // Base64 encoded
	EntryType     string    `json:"entry_type"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
