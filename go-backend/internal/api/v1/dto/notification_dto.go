package dto

// RegisterDeviceTokenRequest represents the request to register a device token
type RegisterDeviceTokenRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Token    string `json:"token" validate:"required"`
	Platform string `json:"platform" validate:"required,oneof=ios android"`
}

// SendNotificationRequest represents the request to send a notification to specific users
type SendNotificationRequest struct {
	UserEmails []string               `json:"userEmails" validate:"required,min=1,dive,email"`
	Title      string                 `json:"title" validate:"required"`
	Body       string                 `json:"body" validate:"required"`
	Data       map[string]interface{} `json:"data,omitempty"`
	MicroappID string                 `json:"microappId" validate:"required"`
}

// SendToGroupsRequest represents the request to send a notification to user groups
type SendToGroupsRequest struct {
	Groups     []string               `json:"groups" validate:"required,min=1"`
	Title      string                 `json:"title" validate:"required"`
	Body       string                 `json:"body" validate:"required"`
	Data       map[string]interface{} `json:"data,omitempty"`
	MicroappID *string                `json:"microappId,omitempty"`
}

// NotificationResponse represents the response after sending notifications
type NotificationResponse struct {
	Success int    `json:"success"`
	Failed  int    `json:"failed"`
	Message string `json:"message"`
}
