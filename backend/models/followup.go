package models

import "time"

type FollowUp struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ReportID  uint      `json:"report_id"`
	AdminID   uint      `json:"admin_id"`
	Deskripsi string    `json:"deskripsi"`
	PhotoURL  string    `json:"photo_url"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	Admin User `gorm:"foreignKey:AdminID" json:"admin"`
}
