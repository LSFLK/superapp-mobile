package models

import "time"

type DeviceToken struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserEmail   string    `gorm:"column:user_email;type:varchar(255);not null;index:idx_user_email"`
	DeviceToken string    `gorm:"column:device_token;type:text;not null"`
	Platform    string    `gorm:"column:platform;type:enum('ios','android');not null"`
	CreatedAt   time.Time `gorm:"column:created_at;not null;autoCreateTime"`
	UpdatedAt   time.Time `gorm:"column:updated_at;not null;autoUpdateTime"`
	IsActive    bool      `gorm:"column:is_active;type:tinyint(1);not null;default:1;index:idx_is_active"`
}

func (DeviceToken) TableName() string {
	return "device_tokens"
}
