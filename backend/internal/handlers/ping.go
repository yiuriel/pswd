package handlers

import (
	"fmt"
	"net/http"
)

func Ping(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "pong")
}
