package auth

import "time"

type CustomJwtPayload struct {
	Email  string   `json:"email"`
	Groups []string `json:"groups"`
}

type JWTHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
	Kid string `json:"kid"`
}

type Claims struct {
	Iss       string   `json:"iss"`
	Sub       string   `json:"sub"`
	Aud       string   `json:"aud"`
	Exp       int64    `json:"exp"`
	Nbf       int64    `json:"nbf"`
	Iat       int64    `json:"iat"`
	Jti       string   `json:"jti"`
	Email     string   `json:"email"`
	Groups    []string `json:"groups"`
	GivenName string   `json:"given_name"`
}

type ParsedJWT struct {
	Header       JWTHeader
	Claims       Claims
	Signature    []byte
	SigningInput string
}

type JSONWebKey struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	N   string `json:"n"`
	E   string `json:"e"`
	Alg string `json:"alg"`
}

type JSONWebKeySet struct {
	Keys []JSONWebKey `json:"keys"`
}

type JWKSCacheEntry struct {
	keys      JSONWebKeySet
	expiresAt time.Time
}
