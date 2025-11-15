package models

import "time"

type MicroApp struct {
	ID             int               `gorm:"column:id;primaryKey;autoIncrement"`
	MicroAppID     string            `gorm:"column:micro_app_id;not null;uniqueIndex"`
	Name           string            `gorm:"column:name;type:varchar(1024);not null"`
	Description    *string           `gorm:"column:description;type:text"`
	PromoText      *string           `gorm:"column:promo_text;type:varchar(1024)"`
	IconURL        *string           `gorm:"column:icon_url;type:varchar(2083)"`
	BannerImageURL *string           `gorm:"column:banner_image_url;type:varchar(2083)"`
	CreatedBy      string            `gorm:"column:created_by;type:varchar(319);not null"`
	UpdatedBy      *string           `gorm:"column:updated_by;type:varchar(319)"`
	CreatedAt      time.Time         `gorm:"column:created_at;not null;autoCreateTime"`
	UpdatedAt      *time.Time        `gorm:"column:updated_at;autoUpdateTime"`
	Active         int               `gorm:"column:active;type:tinyint(1);not null;default:1"`
	Mandatory      int               `gorm:"column:mandatory;type:tinyint(1);not null;default:0"`
	Versions       []MicroAppVersion `gorm:"foreignKey:MicroAppID;references:MicroAppID"`
	Roles          []MicroAppRole    `gorm:"foreignKey:MicroAppID;references:MicroAppID"`
	Configs        []MicroAppConfig  `gorm:"foreignKey:MicroAppID;references:MicroAppID"`
}

func (MicroApp) TableName() string {
	return "micro_app"
}
