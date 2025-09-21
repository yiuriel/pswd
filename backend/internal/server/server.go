package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"backend/pswd/internal/handlers"
)

func New() http.Handler {
	r := chi.NewRouter()

	// register routes
	r.Get("/ping", handlers.Ping)

	return r
}
