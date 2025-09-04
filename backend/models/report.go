package models

import "time"

type Report struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TrackingID  string    `gorm:"uniqueIndex" json:"tracking_id"`
	IsAnonymous bool      `json:"is_anonymous"`
	Title       string    `json:"title"`
	Wilayah     string    `json:"wilayah"`
	Lokasi      string    `json:"lokasi"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	UserID      uint      `json:"user_id"`
	CategoryID  *uint     `json:"category_id"`
	Category    Category  `gorm:"foreignKey:CategoryID" json:"category"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User       User        `gorm:"foreignKey:UserID" json:"user"`
	Riwayat    []Riwayat   `gorm:"foreignKey:ReportID" json:"riwayat"`
	Comments   []Comment   `gorm:"foreignKey:ReportID" json:"comments"`
	FollowUps  []FollowUp  `gorm:"foreignKey:ReportID" json:"followups"`
	BuktiFotos []BuktiFoto `gorm:"foreignKey:ReportID" json:"bukti_fotos"`
}
