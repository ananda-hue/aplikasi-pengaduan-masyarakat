package models

import "time"

// Model Riwayat contoh
type Riwayat struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ReportID  uint      `json:"report_id"`
	Status    string    `json:"status"`
	Tanggal   time.Time `json:"tanggal"`
	Deskripsi string    `json:"deskripsi"`
}
