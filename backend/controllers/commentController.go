package controllers

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"time"

	"github.com/gin-gonic/gin"
)

// Tambah komentar oleh user login
func CreateComment(c *gin.Context) {
	var input struct {
		ReportID uint   `json:"report_id"`
		Text     string `json:"text"`
	}

	if err := c.ShouldBindJSON(&input); err != nil || input.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Komentar tidak boleh kosong"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	comment := models.Comment{
		ReportID:  input.ReportID,
		UserID:    userIDVal.(uint),
		Text:      input.Text,
		CreatedAt: time.Now(),
	}

	if err := config.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menambahkan komentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Komentar berhasil ditambahkan", "data": comment})
}

// Ambil komentar berdasarkan report_id
func GetCommentsByReport(c *gin.Context) {
	reportID := c.Param("report_id")
	var comments []models.Comment

	if err := config.DB.Preload("User").Where("report_id = ?", reportID).Order("created_at DESC").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil komentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": comments})
}

func GetCommentTrends(c *gin.Context) {
	type PeriodCount struct {
		Period string
		Count  int64
	}
	var rows []PeriodCount
	db := config.DB.Model(&models.Comment{})
	// Query berdasarkan week
	db.Select("DATE_FORMAT(created_at, '%x-W%v') as period, COUNT(*) as count").
		Group("period").
		Order("period DESC").
		Limit(12).
		Scan(&rows)
	c.JSON(http.StatusOK, gin.H{"data": rows})
}
