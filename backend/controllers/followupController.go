package controllers

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Admin menambahkan tindak lanjut
func CreateFollowUp(c *gin.Context) {
	// Ambil field deskripsi dari multipart form
	deskripsi := c.PostForm("deskripsi")
	reportIDStr := c.PostForm("report_id")
	if deskripsi == "" || reportIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Deskripsi dan report_id wajib diisi"})
		return
	}

	// Parsing report_id dari string ke uint
	reportID64, err := strconv.ParseUint(reportIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "report_id tidak valid"})
		return
	}
	reportID := uint(reportID64)

	adminIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	adminID := adminIDVal.(uint)

	// Cek upload file foto optional
	var photoPath string
	file, err := c.FormFile("photo")
	if err == nil && file != nil {
		// Generate nama file agar unik (bisa pakai timestamp, UUID, dll)
		filename := time.Now().Format("20060102150405") + "_" + file.Filename
		photoPath = "bukti_foto/" + filename

		// Simpan file ke storage/folder pada server:
		if err := c.SaveUploadedFile(file, photoPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan foto", "error": err.Error()})
			return
		}
	}

	// Buat followup baru
	followUp := models.FollowUp{
		ReportID:  reportID,
		AdminID:   adminID,
		Deskripsi: deskripsi,
		PhotoURL:  photoPath,
		CreatedAt: time.Now(),
	}

	if err := config.DB.Create(&followUp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menambahkan tindak lanjut"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tindak lanjut berhasil ditambahkan", "data": followUp})
}

// Ambil semua tindak lanjut berdasarkan report_id
func GetFollowUpsByReport(c *gin.Context) {
	reportID := c.Param("report_id")
	var followups []models.FollowUp

	if err := config.DB.Preload("Admin").Where("report_id = ?", reportID).Order("created_at DESC").Find(&followups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil tindak lanjut"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": followups})
}

func GetFollowupTrends(c *gin.Context) {
	type PeriodCount struct {
		Period string
		Count  int64
	}
	var rows []PeriodCount
	db := config.DB.Model(&models.FollowUp{})
	// Query berdasarkan week
	db.Select("DATE_FORMAT(created_at, '%x-W%v') as period, COUNT(*) as count").
		Group("period").
		Order("period DESC").
		Limit(12).
		Scan(&rows)
	c.JSON(http.StatusOK, gin.H{"data": rows})
}
