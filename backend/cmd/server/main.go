package main

import (
	"fmt"
	"log"
	"net/http"

	"backend/pswd/internal/server"
)

func main() {
	srv := server.New()

	fmt.Println("Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", srv); err != nil {
		log.Fatal(err)
	}
}
