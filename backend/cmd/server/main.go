package main

import (
	"backend/pswd/internal/handlers"
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	var err error

	// Read from environment variables with defaults
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "pswd")
	dbPassword := getEnv("DB_PASSWORD", "pswd")
	dbName := getEnv("DB_NAME", "pswd")

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	db, err = sql.Open("postgres", connStr)

	if err != nil {
		log.Fatal(err)
	}

	if err := initSchema(context.Background(), db); err != nil {
		log.Println("Failed to initialize schema:", err)
		log.Fatal(err)
	}

	// Initialize handlers
	h := &handlers.Handler{DB: db}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Frontend dev servers
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Cache preflight for 5 minutes
	}))

	// Public routes
	r.Post("/api/auth/register", h.RegisterHandler)
	r.Post("/api/auth/login", h.LoginHandler)
	r.Post("/api/auth/logout", h.LogoutHandler)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(h.AuthMiddleware)

		// User info
		r.Get("/api/user/me", h.GetUserInfoHandler)

		// Vault entries
		r.Post("/api/vault/entries", h.CreateVaultEntryHandler)
		r.Get("/api/vault/entries", h.GetVaultEntriesHandler)
		r.Put("/api/vault/entries/{entryID}", h.UpdateVaultEntryHandler)
		r.Delete("/api/vault/entries/{entryID}", h.DeleteVaultEntryHandler)
	})

	// Erase DB data
	r.Post("/api/__$RESET$", h.EraseDBDataHandler)

	port := getEnv("PORT", "8080")
	log.Printf("🚀 Server running on http://localhost:%s\n", port)
	http.ListenAndServe(":"+port, r)
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func initSchema(ctx context.Context, db *sql.DB) error {
	// First, verify database connection
	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("database connection failed: %w", err)
	}

	// Check if users table exists and has correct schema
	var tableExists bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = 'users'
		)
	`).Scan(&tableExists)

	if err != nil {
		return fmt.Errorf("failed to check existing tables: %w", err)
	}

	if tableExists {
		log.Println("⚠️  Tables already exist. Verifying schema...")
		// Verify users table has user_id column
		var hasUserID bool
		err = db.QueryRowContext(ctx, `
			SELECT EXISTS (
				SELECT FROM information_schema.columns 
				WHERE table_schema = 'public' 
				AND table_name = 'users'
				AND column_name = 'user_id'
			)
		`).Scan(&hasUserID)

		if err != nil {
			return fmt.Errorf("failed to verify schema: %w", err)
		}

		if !hasUserID {
			log.Println("❌ Existing users table is missing user_id column!")
			log.Println("   Please run: DROP TABLE IF EXISTS vault_entries, vaults, devices, users CASCADE;")
			return fmt.Errorf("schema mismatch: users table exists but missing user_id column")
		}
		log.Println("✓ Schema verification passed")
	}

	// Execute each statement separately with logging
	statements := []struct {
		name string
		sql  string
	}{
		{
			name: "pgcrypto extension",
			sql:  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
		},
		{
			name: "users table",
			sql: `CREATE TABLE IF NOT EXISTS users (
				user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				username TEXT UNIQUE NOT NULL,
				email TEXT UNIQUE,
				pk_encrypt TEXT NOT NULL,
				pk_sign TEXT NOT NULL,
				password_hash TEXT,
				is_master_device_registered BOOLEAN DEFAULT false,
				created_at TIMESTAMP DEFAULT now()
			)`,
		},
		{
			name: "devices table",
			sql: `CREATE TABLE IF NOT EXISTS devices (
				device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
				device_name TEXT NOT NULL,
				device_fingerprint TEXT UNIQUE NOT NULL,
				pk_device TEXT NOT NULL,
				is_master BOOLEAN DEFAULT false,
				last_seen TIMESTAMP DEFAULT now(),
				created_at TIMESTAMP DEFAULT now(),
				UNIQUE(user_id, device_fingerprint)
			)`,
		},
		{
			name: "vaults table",
			sql: `CREATE TABLE IF NOT EXISTS vaults (
				vault_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
				created_at TIMESTAMP DEFAULT now()
			)`,
		},
		{
			name: "vault_entries table",
			sql: `CREATE TABLE IF NOT EXISTS vault_entries (
				entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
				title TEXT NOT NULL,
				encrypted_data TEXT NOT NULL,
				entry_type TEXT DEFAULT 'password',
				created_at TIMESTAMP DEFAULT now(),
				updated_at TIMESTAMP DEFAULT now()
			)`,
		},
	}

	for _, stmt := range statements {
		log.Printf("Creating %s...", stmt.name)
		_, err := db.ExecContext(ctx, stmt.sql)
		if err != nil {
			log.Printf("❌ Failed to create %s: %v", stmt.name, err)
			return fmt.Errorf("failed to create %s: %w", stmt.name, err)
		}
		log.Printf("✓ %s ready", stmt.name)
	}

	log.Println("✓ Database schema initialized successfully")
	return nil
}
