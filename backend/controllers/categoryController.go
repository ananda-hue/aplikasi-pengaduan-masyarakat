package controllers

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	var cats []models.Category
	if err := config.DB.Order("name").Find(&cats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil kategori"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cats})
}

func GetCategoriesByUser(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "User ID tidak valid"})
		return
	}

	var cats []models.Category
	if err := config.DB.Where("user_id = ?", uint(userID)).Order("name").Find(&cats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil kategori"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cats})
}

func GetAdminUsers(c *gin.Context) {
	var admins []models.User
	if err := config.DB.Where("role = ?", "admin").Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil daftar admin"})
		return
	}
	// Kirim hanya id dan name cukup
	var result []struct {
		ID   uint   `json:"id"`
		Name string `json:"name"`
	}
	for _, a := range admins {
		result = append(result, struct {
			ID   uint   `json:"id"`
			Name string `json:"name"`
		}{ID: a.ID, Name: a.Name})
	}
	c.JSON(http.StatusOK, result)
}

func CreateCategory(c *gin.Context) {
	roleVal, ok := c.Get("role")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Token tidak valid"})
		return
	}

	roleStr, ok := roleVal.(string)
	adminCategory, _ := c.Get("admin_category")
	adminCategoryStr, _ := adminCategory.(string)

	if !ok || !(roleStr == "superadmin" || (roleStr == "admin" && strings.TrimSpace(adminCategoryStr) == "")) {
		c.JSON(http.StatusForbidden, gin.H{"message": "akses ditolak"})
		return
	}

	var input struct {
		Name   string `json:"name" binding:"required"`
		UserID uint   `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	cat := models.Category{
		Name:   input.Name,
		UserID: input.UserID,
	}

	if err := config.DB.Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat kategori", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kategori dibuat", "data": cat})
}

func UpdateCategory(c *gin.Context) {
	roleVal, ok := c.Get("role")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Token tidak valid"})
		return
	}

	roleStr, _ := roleVal.(string)
	adminCategory, _ := c.Get("admin_category")
	adminCategoryStr, _ := adminCategory.(string)

	// izinkan jika superadmin atau admin tanpa category_id
	if !(roleStr == "superadmin" || (roleStr == "admin" && strings.TrimSpace(adminCategoryStr) == "")) {
		c.JSON(http.StatusForbidden, gin.H{"message": "akses ditolak"})
		return
	}

	idParam := c.Param("id")
	id, _ := strconv.ParseUint(idParam, 10, 64)

	var cat models.Category
	if err := config.DB.First(&cat, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Kategori tidak ditemukan"})
		return
	}

	var input struct {
		Name   string `json:"name" binding:"required"`
		UserID *uint  `json:"user_id"` // optional
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	cat.Name = input.Name
	if input.UserID != nil {
		cat.UserID = *input.UserID
	}
	config.DB.Save(&cat)

	c.JSON(http.StatusOK, gin.H{"message": "Kategori diupdate", "data": cat})
}

func DeleteCategory(c *gin.Context) {
	roleVal, ok := c.Get("role")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Token tidak valid"})
		return
	}

	roleStr, _ := roleVal.(string)
	adminCategory, _ := c.Get("admin_category")
	adminCategoryStr, _ := adminCategory.(string)

	// izinkan jika superadmin atau admin tanpa category_id
	if !(roleStr == "superadmin" || (roleStr == "admin" && strings.TrimSpace(adminCategoryStr) == "")) {
		c.JSON(http.StatusForbidden, gin.H{"message": "akses ditolak"})
		return
	}

	idParam := c.Param("id")
	id, _ := strconv.ParseUint(idParam, 10, 64)

	// Cek referensi di users/reports sebelum hapus (safety)
	var count int64
	config.DB.Model(&models.User{}).Where("category_id = ?", uint(id)).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Kategori masih digunakan oleh user; kosongkan dulu atau ubah ke kategori lain"})
		return
	}

	if err := config.DB.Delete(&models.Category{}, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus kategori"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kategori dihapus"})
}
