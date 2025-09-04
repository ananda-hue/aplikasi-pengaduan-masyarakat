package controllers

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SoftDeleteBuktiFoto - Soft delete bukti foto (untuk admin)
func SoftDeleteBuktiFoto(c *gin.Context) {
	id := c.Param("id")

	var buktiFoto models.BuktiFoto

	// Cek pakai Unscoped supaya ketemu walau sudah soft delete
	if err := config.DB.Unscoped().First(&buktiFoto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Bukti foto tidak ditemukan"})
		return
	}

	// Kalau sudah soft delete, jangan hapus ulang
	if buktiFoto.DeletedAt.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bukti foto sudah dihapus"})
		return
	}

	if err := config.DB.Delete(&buktiFoto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus bukti foto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bukti foto berhasil dihapus",
		"data":    buktiFoto,
	})
}

// RestoreBuktiFoto - Restore bukti foto yang sudah di soft delete
func RestoreBuktiFoto(c *gin.Context) {
	id := c.Param("id")

	var buktiFoto models.BuktiFoto

	// Cari bukti foto yang sudah di soft delete
	if err := config.DB.Unscoped().Where("id = ? AND deleted_at IS NOT NULL", id).First(&buktiFoto).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Bukti foto yang terhapus tidak ditemukan",
		})
		return
	}

	// Restore bukti foto
	if err := config.DB.Unscoped().Model(&buktiFoto).Update("deleted_at", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal memulihkan bukti foto",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bukti foto berhasil dipulihkan",
		"data":    buktiFoto,
	})
}

// HardDeleteBuktiFoto - Hard delete bukti foto (benar-benar hapus dari database)
func HardDeleteBuktiFoto(c *gin.Context) {
	id := c.Param("id")

	var buktiFoto models.BuktiFoto

	// Cari bukti foto (termasuk yang sudah soft delete)
	if err := config.DB.Unscoped().First(&buktiFoto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Bukti foto tidak ditemukan",
		})
		return
	}

	// Hard delete bukti foto
	if err := config.DB.Unscoped().Delete(&buktiFoto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal menghapus permanen bukti foto",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bukti foto berhasil dihapus permanen",
	})
}

// GetAllBuktiFotoAdmin - Get semua bukti foto termasuk yang sudah dihapus (khusus admin)
func GetAllBuktiFotoAdmin(c *gin.Context) {
	var buktiFotos []models.BuktiFoto

	// Parse query parameters
	includeDeleted := c.Query("include_deleted") == "true"
	onlyDeleted := c.Query("only_deleted") == "true"

	query := config.DB.Preload("Report")

	if onlyDeleted {
		// Hanya tampilkan yang sudah dihapus
		query = query.Unscoped().Where("deleted_at IS NOT NULL")
	} else if includeDeleted {
		// Tampilkan semua termasuk yang sudah dihapus
		query = query.Unscoped()
	}
	// Jika tidak ada parameter, default GORM akan mengabaikan yang soft deleted

	if err := query.Find(&buktiFotos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil data bukti foto",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data bukti foto berhasil diambil",
		"data":    buktiFotos,
	})
}

// GetReportWithAllBuktiFoto - Get report dengan semua bukti foto termasuk yang dihapus (khusus admin)
func GetReportWithAllBuktiFoto(c *gin.Context) {
	var report models.Report
	id := c.Param("id")

	// Parse query parameter
	includeDeleted := c.Query("include_deleted") == "true"

	query := config.DB.Preload("User").Preload("Category").Preload("Riwayat")

	if includeDeleted {
		// Preload BuktiFotos termasuk yang sudah soft delete
		query = query.Preload("BuktiFotos", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped() // Ini akan mengambil semua bukti foto termasuk yang soft deleted
		})
	} else {
		// Preload BuktiFotos normal (tidak termasuk yang soft deleted)
		query = query.Preload("BuktiFotos")
	}

	if err := query.First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Laporan tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data laporan berhasil diambil",
		"data":    report,
	})
}

// GetBuktiFotoStats - Get statistik bukti foto untuk admin dashboard
func GetBuktiFotoStats(c *gin.Context) {
	var total, active, deleted int64

	// Total semua bukti foto
	config.DB.Unscoped().Model(&models.BuktiFoto{}).Count(&total)

	// Bukti foto yang aktif
	config.DB.Model(&models.BuktiFoto{}).Count(&active)

	// Bukti foto yang sudah dihapus
	config.DB.Unscoped().Where("deleted_at IS NOT NULL").Model(&models.BuktiFoto{}).Count(&deleted)

	c.JSON(http.StatusOK, gin.H{
		"message": "Statistik bukti foto berhasil diambil",
		"data": gin.H{
			"total":   total,
			"active":  active,
			"deleted": deleted,
		},
	})
}
