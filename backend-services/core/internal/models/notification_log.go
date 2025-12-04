package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// JSONMap is a custom type for storing JSON data
type JSONMap map[string]interface{}

// Scan implements the sql.Scanner interface
func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// Value implements the driver.Valuer interface
func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

type NotificationLog struct {
	ID         int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserEmail  string    `gorm:"column:user_email;type:varchar(255);not null;index:idx_user_email"`
	Title      *string   `gorm:"column:title;type:varchar(255)"`
	Body       *string   `gorm:"column:body;type:text"`
	Data       JSONMap   `gorm:"column:data;type:json"`
	SentAt     time.Time `gorm:"column:sent_at;not null;autoCreateTime;index:idx_sent_at"`
	Status     *string   `gorm:"column:status;type:varchar(50)"`
	MicroappID *string   `gorm:"column:microapp_id;type:varchar(100);index:idx_microapp_id"`
}

func (NotificationLog) TableName() string {
	return "notification_logs"
}
