package middleware

import (
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// IPRateLimiter holds the rate limiters per IP address
type IPRateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit
	b   int
}

// NewIPRateLimiter creates a new rate limiter
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	return &IPRateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}
}

// AddIP creates a new rate limiter for an IP address
func (i *IPRateLimiter) AddIP(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	limiter := rate.NewLimiter(i.r, i.b)
	i.ips[ip] = limiter

	return limiter
}

// GetLimiter returns the rate limiter for the provided IP address
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	limiter, exists := i.ips[ip]

	if !exists {
		i.mu.Unlock()
		return i.AddIP(ip)
	}

	i.mu.Unlock()
	return limiter
}

// GetRateLimitConfig returns rate limit configuration based on environment
func GetRateLimitConfig() (rate.Limit, int) {
	env := os.Getenv("ENV")
	
	if env == "production" {
		// Production: 5 requests per second, burst of 10
		rps := getEnvInt("RATE_LIMIT_RPS", 5)
		burst := getEnvInt("RATE_LIMIT_BURST", 10)
		return rate.Limit(rps), burst
	}
	
	// Development: 20 requests per second, burst of 50
	rps := getEnvInt("RATE_LIMIT_RPS", 20)
	burst := getEnvInt("RATE_LIMIT_BURST", 50)
	return rate.Limit(rps), burst
}

// getEnvInt gets an environment variable as int or returns default
func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	
	return intValue
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get IP address from request
			ip := r.RemoteAddr
			
			// Check for X-Forwarded-For header (for proxies)
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = forwarded
			}
			
			// Get rate limiter for this IP
			limiter := limiter.GetLimiter(ip)
			
			// Check if request is allowed
			if !limiter.Allow() {
				http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
				return
			}
			
			next.ServeHTTP(w, r)
		})
	}
}

// CleanupOldIPs periodically removes old IP entries to prevent memory leak
func (i *IPRateLimiter) CleanupOldIPs(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			i.mu.Lock()
			// Simple cleanup: reset the map periodically
			// In production, you might want more sophisticated cleanup
			if len(i.ips) > 10000 {
				i.ips = make(map[string]*rate.Limiter)
			}
			i.mu.Unlock()
		}
	}()
}
