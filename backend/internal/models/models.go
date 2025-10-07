package models

import "time"

// User represents a user in the system
type User struct {
	UserID                   string    `json:"user_id" db:"user_id"`
	Username                 string    `json:"username" db:"username"`
	Email                    string    `json:"email" db:"email"`
	PkEncrypt                string    `json:"pk_encrypt" db:"pk_encrypt"`
	PkSign                   string    `json:"pk_sign" db:"pk_sign"`
	PasswordHash             string    `json:"-" db:"password_hash"`
	IsMasterDeviceRegistered bool      `json:"is_master_device_registered" db:"is_master_device_registered"`
	CreatedAt                time.Time `json:"created_at" db:"created_at"`
}

// Device represents a device registered to a user
type Device struct {
	DeviceID          string    `json:"device_id" db:"device_id"`
	UserID            string    `json:"user_id" db:"user_id"`
	DeviceName        string    `json:"device_name" db:"device_name"`
	DeviceFingerprint string    `json:"device_fingerprint" db:"device_fingerprint"`
	PkDevice          string    `json:"pk_device" db:"pk_device"`
	IsMaster          bool      `json:"is_master" db:"is_master"`
	LastSeen          time.Time `json:"last_seen" db:"last_seen"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

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

// Request/Response DTOs
type RegisterRequest struct {
	Username         string `json:"username"`
	Email            string `json:"email"`
	Password         string `json:"password"`
	PkEncrypt        string `json:"pk_encrypt"`
	PkSign           string `json:"pk_sign"`
	DeviceName       string `json:"device_name"`
	DeviceFingerprint string `json:"device_fingerprint"`
	PkDevice         string `json:"pk_device"`
}

type RegisterResponse struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Token    string `json:"token"`
	DeviceID string `json:"device_id"`
	IsMaster bool   `json:"is_master"`
}

type LoginRequest struct {
	Username          string `json:"username"`
	Password          string `json:"password"`
	DeviceFingerprint string `json:"device_fingerprint"`
}

type LoginResponse struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Token    string `json:"token"`
	DeviceID string `json:"device_id"`
	IsMaster bool   `json:"is_master"`
}

type VaultEntryRequest struct {
	Title         string `json:"title"`
	EncryptedData string `json:"encrypted_data"` // Base64 encoded
	EntryType     string `json:"entry_type"`
}

type VaultEntryResponse struct {
	EntryID       string    `json:"entry_id"`
	Title         string    `json:"title"`
	EncryptedData string    `json:"encrypted_data"` // Base64 encoded
	EntryType     string    `json:"entry_type"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
