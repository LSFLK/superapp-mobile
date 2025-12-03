package main

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"os"

	"github.com/golang-jwt/jwt/v4"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Fprintf(os.Stderr, "Usage: %s <public_key.pem> <key_id>\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "\nExample:\n")
		fmt.Fprintf(os.Stderr, "  %s public_key.pem superapp-key-1\n", os.Args[0])
		os.Exit(1)
	}

	pubKeyPath := os.Args[1]
	keyID := os.Args[2]

	// Load public key
	pubKeyBytes, err := os.ReadFile(pubKeyPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading public key: %v\n", err)
		os.Exit(1)
	}

	pubKey, err := jwt.ParseRSAPublicKeyFromPEM(pubKeyBytes)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing public key: %v\n", err)
		os.Exit(1)
	}

	// Create JWKS
	jwks := createJWKS(pubKey, keyID)

	// Output as JSON
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(jwks); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JWKS: %v\n", err)
		os.Exit(1)
	}
}

func createJWKS(pubKey *rsa.PublicKey, keyID string) map[string]interface{} {
	// Encode N (modulus) as base64url
	nBytes := pubKey.N.Bytes()
	nStr := base64.RawURLEncoding.EncodeToString(nBytes)

	// Encode E (exponent) as base64url
	eBytes := big.NewInt(int64(pubKey.E)).Bytes()
	eStr := base64.RawURLEncoding.EncodeToString(eBytes)

	return map[string]interface{}{
		"keys": []map[string]interface{}{
			{
				"kty": "RSA",
				"use": "sig",
				"kid": keyID,
				"n":   nStr,
				"e":   eStr,
				"alg": "RS256",
			},
		},
	}
}
