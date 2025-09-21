package server

import (
	"encoding/json"
	"net/http"

	"backend/pswd/internal/models"
	"backend/pswd/internal/repositories"

	"github.com/go-chi/chi/v5"
)

func New(userRepo *repositories.UserRepo) http.Handler {
	r := chi.NewRouter()

	// GET /ping
	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("pong"))
	})

	// POST /users
	r.Post("/users", func(w http.ResponseWriter, r *http.Request) {
		var u models.User
		if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err := userRepo.Insert(u); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	// GET /users
	r.Get("/users", func(w http.ResponseWriter, r *http.Request) {
		users, err := userRepo.GetAll()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(users)
	})

	return r
}
