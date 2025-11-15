package models

import (
	"encoding/json"
)

type MicroAppConfig struct {
	MicroAppID  string          `gorm:"column:micro_app_id;type:varchar(255);primaryKey"`
	ConfigKey   string          `gorm:"column:config_key;type:varchar(255);primaryKey"`
	ConfigValue json.RawMessage `gorm:"column:config_value;type:json;not null"`
	Active      int             `gorm:"column:active;type:tinyint(1);not null;default:1"`
	CreatedBy   string          `gorm:"column:created_by;type:varchar(319);not null"`
	UpdatedBy   string          `gorm:"column:updated_by;type:varchar(319);not null"`
}

func (MicroAppConfig) TableName() string {
	return "micro_app_config"
}
