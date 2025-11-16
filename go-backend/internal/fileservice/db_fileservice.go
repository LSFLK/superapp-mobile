package fileservice

import (
	"fmt"
	"log/slog"
	"sync"

	"go-backend/internal/config"
	"go-backend/internal/database"

	"gorm.io/gorm"
)

type MicroAppFile struct {
	FileName    string `gorm:"column:file_name;primaryKey;type:varchar(255)"`
	BlobContent []byte `gorm:"column:blob_content;type:mediumblob;not null"`
}

func (MicroAppFile) TableName() string {
	return "micro_apps_storage"
}

type DBFileService struct {
	db      *gorm.DB
	baseURL string
}

var _ FileService = (*DBFileService)(nil)

var (
	dbFileServiceInstance FileService
	dbFileServiceOnce     sync.Once
)

// NewDBFileService returns a singleton instance of DBFileService
func NewDBFileService() FileService {
	dbFileServiceOnce.Do(func() {
		slog.Info("Creating DB file service singleton instance")

		cfg := config.Load()
		db := database.Connect(cfg)

		// Create table if not exists
		if err := db.AutoMigrate(&MicroAppFile{}); err != nil {
			slog.Error("Failed to create micro_apps_storage table", "error", err)
		}

		dbFileServiceInstance = &DBFileService{
			db:      db,
			baseURL: cfg.BaseURL,
		}
	})

	return dbFileServiceInstance
}

// UpsertFile creates or updates a file in the database
func (s *DBFileService) UpsertFile(fileName string, content []byte) error {
	slog.Info("Upserting file", "fileName", fileName, "size", len(content))

	file := MicroAppFile{
		FileName:    fileName,
		BlobContent: content,
	}

	result := s.db.Save(&file)
	if result.Error != nil {
		slog.Error("Failed to upsert file", "error", result.Error, "fileName", fileName)
		return result.Error
	}

	slog.Info("File upserted successfully", "fileName", fileName)
	return nil
}

// DeleteFile removes a file from the database by fileName
func (s *DBFileService) DeleteFile(fileName string) error {
	slog.Info("Deleting file", "fileName", fileName)

	result := s.db.Where("file_name = ?", fileName).Delete(&MicroAppFile{})

	if result.Error != nil {
		slog.Error("Failed to delete file", "error", result.Error, "fileName", fileName)
		return result.Error
	}

	if result.RowsAffected == 0 {
		slog.Warn("No file found to delete", "fileName", fileName)
		return gorm.ErrRecordNotFound
	}

	slog.Info("File deleted successfully", "fileName", fileName)
	return nil
}

// GetDownloadURL generates the download URL for a file
func (s *DBFileService) GetDownloadURL(fileName string) string {
	return fmt.Sprintf("%s/public/micro-app-files/download/%s", s.baseURL, fileName)
}

// GetBlobContent retrieves the blob content of a file by fileName
func (s *DBFileService) GetBlobContent(fileName string) ([]byte, error) {
	slog.Info("Retrieving blob content", "fileName", fileName)

	var file MicroAppFile
	result := s.db.Where("file_name = ?", fileName).First(&file)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			slog.Warn("File not found", "fileName", fileName)
		} else {
			slog.Error("Failed to retrieve blob content", "error", result.Error, "fileName", fileName)
		}
		return nil, result.Error
	}

	slog.Info("Blob content retrieved successfully", "fileName", fileName, "size", len(file.BlobContent))
	return file.BlobContent, nil
}
