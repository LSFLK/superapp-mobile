package dto

// UserResponse represents the user information returned to clients.
type UserResponse struct {
	Email         string  `json:"workEmail"`
	FirstName     string  `json:"firstName"`
	LastName      string  `json:"lastName"`
	UserThumbnail *string `json:"userThumbnail,omitempty"`
	Location      *string `json:"location,omitempty"`
}

// UpsertUserRequest represents the request body for creating/updating a user.
type UpsertUserRequest struct {
	Email         string  `json:"workEmail" validate:"required,email"`
	FirstName     string  `json:"firstName" validate:"required,min=1"`
	LastName      string  `json:"lastName" validate:"required,min=1"`
	UserThumbnail *string `json:"userThumbnail,omitempty"`
	Location      *string `json:"location,omitempty"`
}
