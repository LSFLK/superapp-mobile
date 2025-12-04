package dto

// TokenExchangeRequest is the request body for token exchange
type TokenExchangeRequest struct {
	MicroappID string `json:"microapp_id" validate:"required"`
	Scope      string `json:"scope,omitempty"`
}

// TokenExchangeResponse is the response for token exchange
type TokenExchangeResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}
