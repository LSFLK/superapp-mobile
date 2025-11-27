package core

// FileService defines the interface for file-related operations.
type FileService interface {
	UpsertFile(fileName string, content []byte) error
	DeleteFile(fileName string) error
	GetDownloadURL(fileName string) string
}
