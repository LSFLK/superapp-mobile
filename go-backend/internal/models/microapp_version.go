package models

import "time"

type MicroAppVersion struct {
	ID           int        `gorm:"column:id;primaryKey;autoIncrement"`
	MicroAppID   string     `gorm:"column:micro_app_id;type:varchar(255);not null"`
	Version      string     `gorm:"column:version;type:varchar(32);not null"`
	Build        int        `gorm:"column:build;not null"`
	ReleaseNotes *string    `gorm:"column:release_notes;type:text"`
	IconURL      *string    `gorm:"column:icon_url;type:varchar(2083)"`
	DownloadURL  string     `gorm:"column:download_url;type:varchar(2083);not null"`
	CreatedBy    string     `gorm:"column:created_by;type:varchar(319);not null"`
	UpdatedBy    *string    `gorm:"column:updated_by;type:varchar(319)"`
	CreatedAt    time.Time  `gorm:"column:created_at;not null;autoCreateTime"`
	UpdatedAt    *time.Time `gorm:"column:updated_at;autoUpdateTime"`
	Active       int        `gorm:"column:active;type:tinyint(1);not null;default:1"`
}

func (MicroAppVersion) TableName() string {
	return "micro_app_version"
}
