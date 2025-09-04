package controllers

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetTotalReports -> untuk menghitung total semua aduan (laporan)
func GetTotalReports(c *gin.Context) {
	var totalReports int64

	// Hitung semua laporan di tabel Report
	if err := config.DB.Model(&models.Report{}).Count(&totalReports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung total laporan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_reports": totalReports,
	})
}

func GetAdminStats(c *gin.Context) {
	var (
		userCount        int64
		adminCount       int64
		kategoriCount    int64
		userRegularCount int64
		reportCount      int64
		reportPending    int64
		reportProcessing int64
		reportDone       int64
		reportRejected   int64
		commentCount     int64
		followupCount    int64
	)

	roleVal, _ := c.Get("role")
	role := strings.TrimSpace(roleVal.(string))

	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	var admin models.User
	if err := config.DB.First(&admin, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data admin"})
		return
	}

	baseDB := config.DB.Model(&models.Report{})

	if role == "admin" {
		var categories []models.Category
		if err := config.DB.Where("user_id = ?", admin.ID).Find(&categories).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil kategori admin"})
			return
		}
		var categoryIDs []uint
		for _, cat := range categories {
			categoryIDs = append(categoryIDs, cat.ID)
		}

		// Hanya filter kalau admin punya kategori
		if len(categoryIDs) > 0 {
			baseDB = baseDB.Where("category_id IN ?", categoryIDs)
		}
	}

	if err := baseDB.Count(&reportCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung total laporan"})
		return
	}

	if err := config.DB.Model(&models.Report{}).Scopes(filterCategory(role, admin.ID)).Where("status = ?", "Diajukan").Count(&reportPending).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung laporan Diajukan"})
		return
	}

	if err := config.DB.Model(&models.Report{}).Scopes(filterCategory(role, admin.ID)).Where("status = ?", "Diproses").Count(&reportProcessing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung laporan Diproses"})
		return
	}

	if err := config.DB.Model(&models.Report{}).Scopes(filterCategory(role, admin.ID)).Where("status = ?", "Selesai").Count(&reportDone).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung laporan Selesai"})
		return
	}

	if err := config.DB.Model(&models.Report{}).Scopes(filterCategory(role, admin.ID)).Where("status = ?", "Ditolak").Count(&reportRejected).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung laporan Ditolak"})
		return
	}

	if err := config.DB.Model(&models.User{}).Count(&userCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung jumlah user"})
		return
	}

	if err := config.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung jumlah admin"})
		return
	}

	if err := config.DB.Model(&models.User{}).Where("role = ?", "kategori_admin").Count(&kategoriCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung jumlah kategori_admin"})
		return
	}

	if err := config.DB.Model(&models.User{}).Where("role = ?", "user").Count(&userRegularCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung jumlah user reguler"})
		return
	}

	if err := config.DB.Model(&models.Comment{}).Count(&commentCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung komentar"})
		return
	}

	if err := config.DB.Model(&models.FollowUp{}).Count(&followupCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghitung tindak lanjut"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_count":           userCount,
		"admin_count":          adminCount,
		"kategori_admin_count": kategoriCount,
		"user_regular_count":   userRegularCount,
		"report_count":         reportCount,
		"pending_reports":      reportPending,
		"processing_reports":   reportProcessing,
		"done_reports":         reportDone,
		"rejected_reports":     reportRejected,
		"comment_count":        commentCount,
		"followup_count":       followupCount,
	})
}

// Scope helper to abstract category filtering
func filterCategory(role string, userID uint) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if role == "admin" || role == "kategori_admin" {
			var categories []models.Category
			err := config.DB.Where("user_id = ?", userID).Find(&categories).Error
			if err != nil {
				return db // jangan filter kalau error
			}
			var categoryIDs []uint
			for _, cat := range categories {
				categoryIDs = append(categoryIDs, cat.ID)
			}
			if len(categoryIDs) > 0 {
				return db.Where("category_id IN ?", categoryIDs)
			}
			return db // kalau tidak punya kategori, lihat semua
		}
		return db
	}
}

// Tambahkan endpoint baru
func GetTrends(c *gin.Context) {
	type PeriodCount struct {
		Period string
		Count  int64
	}

	period := c.Query("period") // "week" atau "month"
	if period != "week" && period != "month" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid period"})
		return
	}

	// Format tanggal berdasarkan periode
	dateFormat := "%Y-%m"
	if period == "week" {
		dateFormat = "%x-W%v"
	}

	var reports, comments, followups []PeriodCount

	// Query tren laporan
	config.DB.Model(&models.Report{}).
		Select("DATE_FORMAT(created_at, ?) as period, COUNT(*) as count", dateFormat).
		Group("period").
		Order("period DESC").
		Limit(12).
		Scan(&reports)

	// Query tren komentar
	config.DB.Model(&models.Comment{}).
		Select("DATE_FORMAT(created_at, ?) as period, COUNT(*) as count", dateFormat).
		Group("period").
		Order("period DESC").
		Limit(12).
		Scan(&comments)

	// Query tren tindak lanjut
	config.DB.Model(&models.FollowUp{}).
		Select("DATE_FORMAT(created_at, ?) as period, COUNT(*) as count", dateFormat).
		Group("period").
		Order("period DESC").
		Limit(12).
		Scan(&followups)

	// Kembalikan hasil semua tren dalam satu respons
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"reports":   reports,
			"comments":  comments,
			"followups": followups,
		},
	})
}

func GetReportsByCategory(c *gin.Context) {
	type CategoryCount struct {
		CategoryID uint   `json:"category_id"`
		Kategori   string `json:"kategori"`
		Count      int64  `json:"count"`
	}

	var rows []CategoryCount

	// Join ke tabel Category dan group berdasarkan category_id
	config.DB.Model(&models.Report{}).
		Select("category_id, categories.name as kategori, COUNT(*) as count").
		Joins("LEFT JOIN categories ON categories.id = reports.category_id").
		Group("category_id, categories.name").
		Scan(&rows)

	c.JSON(http.StatusOK, gin.H{"data": rows})
}
