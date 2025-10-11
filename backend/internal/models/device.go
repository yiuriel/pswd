package models

import "time"

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
