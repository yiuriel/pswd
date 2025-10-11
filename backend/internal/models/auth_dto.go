package models

// RegisterRequest contains the data needed for user registration
type RegisterRequest struct {
	Username          string `json:"username"`
	Email             string `json:"email"`
	Password          string `json:"password"`
	PkEncrypt         string `json:"pk_encrypt"`
	PkSign            string `json:"pk_sign"`
	DeviceName        string `json:"device_name"`
	DeviceFingerprint string `json:"device_fingerprint"`
	PkDevice          string `json:"pk_device"`
}

// RegisterResponse contains the response data after successful registration
type RegisterResponse struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Token    string `json:"token"`
	DeviceID string `json:"device_id"`
	IsMaster bool   `json:"is_master"`
}

// LoginRequest contains the data needed for user login
type LoginRequest struct {
	Username          string `json:"username"`
	Password          string `json:"password"`
	DeviceFingerprint string `json:"device_fingerprint"`
}

// LoginResponse contains the response data after successful login
type LoginResponse struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Token    string `json:"token"`
	DeviceID string `json:"device_id"`
	IsMaster bool   `json:"is_master"`
}
