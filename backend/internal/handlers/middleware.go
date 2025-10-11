package handlers

import (
	"backend/pswd/internal/auth"
	"net/http"
)

// AuthMiddleware validates JWT tokens from cookie or header
func (h *Handler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from cookie or Authorization header
		tokenString, err := auth.ExtractTokenFromRequest(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Add claims to context
		ctx := r.Context()
		ctx = setUserID(ctx, claims.UserID)
		ctx = setDeviceID(ctx, claims.DeviceID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
