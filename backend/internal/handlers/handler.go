package handlers

import (
	"database/sql"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	DB *sql.DB
}
