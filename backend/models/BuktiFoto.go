package models

import (
	"time"

	"gorm.io/gorm"
)

type BuktiFoto struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ReportID  uint           `json:"report_id"`
	PhotoURL  string         `json:"photo_url"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	Report Report `gorm:"foreignKey:ReportID" json:"report"`
}
