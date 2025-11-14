package auth

import (
	"fmt"
)

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

// ValidateJWT parses, verifies, and validates a JWT string.
func ValidateJWT(tokenString, jwksURL, expectedIssuer, expectedAudience string) (*CustomJwtPayload, error) {
	// 1. Parse the token string
	parsedJWT, err := parseJWT(tokenString)
	if err != nil {
		return nil, fmt.Errorf("could not parse token: %w", err)
	}

	// 2. Fetch the JWKS from the IDP
	keySet, err := fetchJWKS(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("could not fetch JWKS: %w", err)
	}

	// 3. Find the correct key and build a crypto.PublicKey
	publicKey, err := findAndBuildPublicKey(parsedJWT, keySet)
	if err != nil {
		return nil, fmt.Errorf("could not find or build public key: %w", err)
	}

	// 4. Verify the signature
	if err := verifySignature(parsedJWT, publicKey); err != nil {
		return nil, fmt.Errorf("signature verification failed: %w", err)
	}

	// 5. Validate the claims
	if err := validateClaims(&parsedJWT.Claims, expectedIssuer, expectedAudience); err != nil {
		return nil, fmt.Errorf("claims validation failed: %w", err)
	}

	// 6. Extract email and groups from claims
	customPayload := &CustomJwtPayload{
		Email:  parsedJWT.Claims.Email,
		Groups: parsedJWT.Claims.Groups,
	}

	// 7. Success! Return the custom payload.
	return customPayload, nil
}
