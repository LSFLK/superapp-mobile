package dto

type MicroAppRoleResponse struct {
	ID         int    `json:"id"`
	MicroAppID string `json:"microAppId"`
	Role       string `json:"role"`
	Active     int    `json:"active"`
}

type CreateMicroAppRoleRequest struct {
	Role string `json:"role"`
}
