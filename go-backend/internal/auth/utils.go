package auth

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"
)

const (
	maxInt64Bytes     = 8 // size of int64 in bytes
	jwtPartCount      = 3 // parts of JWT format: header.payload.signature
	jwtHeaderIndex    = 0
	jwtPayloadIndex   = 1
	jwtSignatureIndex = 2
)

// parseJWT splits the token and decodes its parts.
func parseJWT(tokenString string) (*ParsedJWT, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != jwtPartCount {
		return nil, errors.New("token must have 3 parts")
	}

	// Decode Header
	headerJSON, err := base64.RawURLEncoding.DecodeString(parts[jwtHeaderIndex])
	if err != nil {
		return nil, fmt.Errorf("failed to decode header: %w", err)
	}
	var header JWTHeader
	if err := json.Unmarshal(headerJSON, &header); err != nil {
		return nil, fmt.Errorf("failed to unmarshal header: %w", err)
	}

	// Decode Claims
	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[jwtPayloadIndex])
	if err != nil {
		return nil, fmt.Errorf("failed to decode claims: %w", err)
	}
	var claims Claims
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, fmt.Errorf("failed to unmarshal claims: %w", err)
	}

	// Decode Signature
	signature, err := base64.RawURLEncoding.DecodeString(parts[jwtSignatureIndex])
	if err != nil {
		return nil, fmt.Errorf("failed to decode signature: %w", err)
	}

	return &ParsedJWT{
		Header:       header,
		Claims:       claims,
		Signature:    signature,
		SigningInput: parts[jwtHeaderIndex] + "." + parts[jwtPayloadIndex],
	}, nil
}

// getJWKS retrieves the JWKS from cache or fetches it if not present or expired.
func getJWKS(jwksURL string) (*JSONWebKeySet, error) {
	return loadJWKS(jwksURL)
}

// findAndBuildPublicKey finds the key in the set matching the token's kid and builds a public key.
func findAndBuildPublicKey(jwt *ParsedJWT, keySet *JSONWebKeySet) (*rsa.PublicKey, error) {
	if jwt.Header.Kid == "" {
		return nil, errors.New("token header does not have a 'kid' (Key ID)")
	}

	for _, key := range keySet.Keys {
		if key.Kid == jwt.Header.Kid {
			// Ensure key is RSA and RS256
			if key.Kty != "RSA" || key.Alg != "RS256" {
				return nil, fmt.Errorf("key with kid '%s' is not a supported RSA RS256 key", key.Kid)
			}

			// Decode the modulus (N)
			nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
			if err != nil {
				return nil, fmt.Errorf("failed to decode modulus: %w", err)
			}
			n := new(big.Int)
			n.SetBytes(nBytes)

			// Decode the exponent (E)
			eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
			if err != nil {
				return nil, fmt.Errorf("failed to decode exponent: %w", err)
			}

			// Convert exponent bytes to int
			var e int
			if len(eBytes) < maxInt64Bytes {
				e = int(new(big.Int).SetBytes(eBytes).Int64())
			} else {
				return nil, errors.New("exponent too large")
			}

			return &rsa.PublicKey{N: n, E: e}, nil
		}
	}

	return nil, fmt.Errorf("no key found in JWKS with kid: '%s'", jwt.Header.Kid)
}

// verifySignature checks if the JWT signature is valid for the given public key.
func verifySignature(jwt *ParsedJWT, pubKey *rsa.PublicKey) error {
	hasher := sha256.New()
	hasher.Write([]byte(jwt.SigningInput))
	digest := hasher.Sum(nil)

	// Verify the PKCS1v15 signature.
	err := rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, digest, jwt.Signature)
	if err != nil {
		return fmt.Errorf("signature is not valid: %w", err)
	}
	return nil
}

// validateClaims checks the standard claims of the token.
func validateClaims(claims *Claims, expectedIssuer, expectedAudience string) error {
	now := time.Now().Unix()

	// Check expiration
	if claims.Exp == 0 || now > claims.Exp {
		return errors.New("token is expired")
	}

	// Check "not before"
	if claims.Nbf != 0 && now < claims.Nbf {
		return errors.New("token is not yet valid")
	}

	// Check issuer
	if claims.Iss != expectedIssuer {
		return fmt.Errorf("invalid issuer: expected '%s', got '%s'", expectedIssuer, claims.Iss)
	}

	// Check audience
	if claims.Aud != expectedAudience {
		return fmt.Errorf("invalid audience: expected '%s', got '%s'", expectedAudience, claims.Aud)
	}

	return nil
}
