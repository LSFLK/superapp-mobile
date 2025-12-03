package models

import "time"

type MicroAppRole struct {
	ID         int        `gorm:"column:id;primaryKey;autoIncrement"`
	MicroAppID string     `gorm:"column:micro_app_id;type:varchar(255);not null"`
	Role       string     `gorm:"column:role;type:varchar(255);not null"`
	CreatedBy  string     `gorm:"column:created_by;type:varchar(319);not null"`
	UpdatedBy  *string    `gorm:"column:updated_by;type:varchar(319)"`
	CreatedAt  time.Time  `gorm:"column:created_at;not null;autoCreateTime"`
	UpdatedAt  *time.Time `gorm:"column:updated_at;autoUpdateTime"`
	Active     int        `gorm:"column:active;type:tinyint(1);not null;default:1"`
}

func (MicroAppRole) TableName() string {
	return "micro_app_role"
}
