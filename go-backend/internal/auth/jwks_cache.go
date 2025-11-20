package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

var (
	cache    = make(map[string]*JWKSCacheEntry)
	cacheMu  sync.RWMutex
	cacheTTL = time.Hour
)

// loadJWKS retrieves the JWKS from cache or fetches it if not present or expired.
func loadJWKS(jwksURL string) (*JSONWebKeySet, error) {
	// Fast read path
	cacheMu.RLock()
	entry, ok := cache[jwksURL]
	if ok && time.Now().Before(entry.expiresAt) {
		keys := entry.keys
		cacheMu.RUnlock()
		return &keys, nil
	}
	cacheMu.RUnlock()

	// Slow write path
	cacheMu.Lock()
	defer cacheMu.Unlock()

	// Double-check after locking
	entry, ok = cache[jwksURL]
	if ok && time.Now().Before(entry.expiresAt) {
		return &entry.keys, nil
	}

	// Fetch fresh JWKS
	keys, err := fetchJWKS(jwksURL)
	if err != nil {
		return nil, err
	}

	cache[jwksURL] = &JWKSCacheEntry{
		keys:      *keys,
		expiresAt: time.Now().Add(cacheTTL),
	}

	return keys, nil
}

// fetchJWKS retrieves the key set from the given URL.
func fetchJWKS(jwksURL string) (*JSONWebKeySet, error) {
	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	var keySet JSONWebKeySet
	if err := json.NewDecoder(resp.Body).Decode(&keySet); err != nil {
		return nil, fmt.Errorf("failed to decode response body: %w", err)
	}
	return &keySet, nil
}
