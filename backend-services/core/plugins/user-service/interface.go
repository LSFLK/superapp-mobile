package userservice

import (
	"go-backend/internal/models"
	"go-backend/internal/registry"
)

// UserService defines the interface for user-related operations.
type UserService interface {
	GetUserByEmail(email string) (*models.User, error)
	GetAllUsers() ([]*models.User, error)
	UpsertUser(user *models.User) error
	UpsertUsers(users []*models.User) error
	DeleteUser(email string) error
}

// Registry is the global registry for FileService implementations.
// Implementations should register themselves in their init() functions.
var Registry = registry.New[UserService]()
