package s3

import (
	"fmt"
	"log/slog"

	"go-backend/internal/fileservice/core"
)

// S3FileService is a placeholder example for S3 implementation
type S3FileService struct {
	bucket string
	region string
}

var _ core.FileService = (*S3FileService)(nil)

// init registers the S3 file service with the core registry
func init() {
	core.Register("s3", func() (core.FileService, error) {
		return NewS3FileService(), nil
	})
}

// NewS3FileService creates a new S3FileService instance
func NewS3FileService() core.FileService {
	slog.Info("Creating S3 file service instance")
	return &S3FileService{
		bucket: "example-bucket",
		region: "us-east-1",
	}
}

func (s *S3FileService) UpsertFile(fileName string, content []byte) error {
	slog.Info("S3: Uploading file", "fileName", fileName, "size", len(content), "bucket", s.bucket)
	// TODO: Implement actual S3 upload logic
	return nil
}

func (s *S3FileService) DeleteFile(fileName string) error {
	slog.Info("S3: Deleting file", "fileName", fileName, "bucket", s.bucket)
	// TODO: Implement actual S3 delete logic
	return nil
}

func (s *S3FileService) GetDownloadURL(fileName string) string {
	// TODO: Generate presigned URL
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, fileName)
}
