package main

import (
	"fmt"
	"log"
	"net/http"

	"backend/pswd/internal/db"
	"backend/pswd/internal/repositories"
	"backend/pswd/internal/server"
)

func main() {
	// connect DB
	database := db.Connect("file:app.db?cache=shared&mode=rwc")
	userRepo := &repositories.UserRepo{DB: database}
	if err := userRepo.CreateTable(); err != nil {
		log.Fatal(err)
	}

	// build server
	srv := server.New(userRepo)

	fmt.Println("Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", srv); err != nil {
		log.Fatal(err)
	}
}
