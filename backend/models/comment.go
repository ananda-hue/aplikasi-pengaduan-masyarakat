package models

import "time"

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ReportID  uint      `json:"report_id"`
	UserID    uint      `json:"user_id"`
	Text      string    `json:"text"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user"`
}
