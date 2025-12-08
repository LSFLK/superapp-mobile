package fileservice

import (
	"go-backend/internal/registry"
)

// FileService defines the interface for file management operations.
type FileService interface {
	UploadFile(fileName string, content []byte) (string, error)
	DeleteFile(fileName string) error
}

// Registry is the global registry for FileService implementations.
// Implementations should register themselves in their init() functions.
var Registry = registry.New[FileService]()
