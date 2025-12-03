package auth

type CustomJwtPayload struct {
	Email  string   `json:"email"`
	Groups []string `json:"groups"`
}

type ServiceInfo struct {
	ClientID string `json:"client_id"` // This is the microapp ID
}
