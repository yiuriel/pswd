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
