package models

import (
	"encoding/json"
	"time"
)

type UserConfig struct {
	ID          uint            `gorm:"column:id;primaryKey;autoIncrement"`
	Email       string          `gorm:"column:email;type:varchar(191);not null;uniqueIndex:idx_email_config_key"`
	ConfigKey   string          `gorm:"column:config_key;type:varchar(191);not null;uniqueIndex:idx_email_config_key"`
	ConfigValue json.RawMessage `gorm:"column:config_value;type:json;not null"`
	Active      int             `gorm:"column:active;type:tinyint(1);not null;default:1"`
	CreatedBy   string          `gorm:"column:created_by;type:varchar(191);not null"`
	UpdatedBy   string          `gorm:"column:updated_by;type:varchar(191);not null"`
	CreatedAt   time.Time       `gorm:"column:created_at;not null;autoCreateTime"`
	UpdatedAt   time.Time       `gorm:"column:updated_at;not null;autoUpdateTime"`
}

func (UserConfig) TableName() string {
	return "user_config"
}
