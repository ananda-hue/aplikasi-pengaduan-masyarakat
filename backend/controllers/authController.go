package controllers

import (
	"fmt"
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("your_secret_key")

func Login(c *gin.Context) {
	var loginData struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	var user models.User
	// Preload categories agar tersedia di user.Categories
	if err := config.DB.Preload("Categories").Where("email = ?", loginData.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid credentials"})
		return
	}

	// Cek apakah user aktif sebelum validasi password
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Akun Anda telah dinonaktifkan. Silakan hubungi admin.",
		})
		return
	}

	// Validasi password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginData.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid credentials"})
		return
	}

	// Ambil ID dan Nama semua kategori yang dimiliki user
	categoryIDs := []uint{}
	categoryNames := []string{}
	for _, cat := range user.Categories {
		categoryIDs = append(categoryIDs, cat.ID)
		categoryNames = append(categoryNames, cat.Name)
	}
	hasCategories := len(categoryIDs) > 0

	// Buat claims untuk token, termasuk info role dan kategori
	claims := jwt.MapClaims{
		"user_id":        user.ID,
		"email":          user.Email,
		"role":           strings.TrimSpace(user.Role),
		"name":           user.Name,
		"category_ids":   categoryIDs,
		"categories":     categoryNames,
		"has_categories": hasCategories,
		"exp":            time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   tokenString,
		"message": "Login successful",
		"user": gin.H{
			"id":           user.ID,
			"name":         user.Name,
			"email":        user.Email,
			"role":         user.Role,
			"is_active":    user.IsActive,
			"category_ids": categoryIDs,
			"categories":   categoryNames,
		},
	})
}

// Helper function (sesuaikan dengan logic existing Anda)
// func getCategoryIDs(user models.User) []uint {
// 	var categoryIDs []uint
// 	for _, category := range user.Categories {
// 		categoryIDs = append(categoryIDs, category.ID)
// 	}
// 	return categoryIDs
// }

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input", "error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to hash password"})
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     "user", // default: user biasa
		// Categories akan kosong untuk user biasa
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create user", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("userID")
	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User  not found"})
		return
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Email != "" {
		user.Email = input.Email
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

func UpdatePassword(c *gin.Context) {
	var input struct {
		OldPassword     string `json:"old_password"`
		NewPassword     string `json:"new_password"`
		ConfirmPassword string `json:"confirm_password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ambil userID dari context dengan cara yang benar
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized - userID not found"})
		return
	}

	// konversi userID ke uint yang benar
	userID, ok := userIDVal.(uint)

	// DEBUG: Print untuk troubleshooting
	fmt.Printf("DEBUG: userIDVal: %+v, userID: %d, ok: %t\n", userIDVal, userID, ok)

	if !ok {
		// Coba casting ke float64 dulu (karena JWT biasanya return float64)
		if userIDFloat, floatOk := userIDVal.(float64); floatOk {
			userID = uint(userIDFloat)
			fmt.Printf("DEBUG: Converted from float64: %f to uint: %d\n", userIDFloat, userID)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid userID format"})
			return
		}
	}

	// cek user di database
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// verifikasi password lama
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.OldPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Old password incorrect"})
		return
	}

	// cek konfirmasi password
	if input.NewPassword != input.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password confirmation does not match"})
		return
	}

	// validasi password baru tidak boleh kosong
	if len(strings.TrimSpace(input.NewPassword)) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password must be at least 6 characters"})
		return
	}

	// hash password baru
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// update password
	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func CreateAdmin(c *gin.Context) {
	userID := c.GetUint("userID")

	var currentUser models.User
	if err := config.DB.Preload("Categories").First(&currentUser, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak ditemukan"})
		return
	}

	isSuperadmin := (currentUser.Role == "admin" && len(currentUser.Categories) == 0) || currentUser.Role == "superadmin"

	if !isSuperadmin {
		c.JSON(http.StatusForbidden, gin.H{"message": "Hanya superadmin yang dapat membuat admin baru"})
		return
	}

	var input struct {
		Name  string `json:"name" binding:"required"`
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid"})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Email sudah digunakan"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Password"), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal enkripsi password"})
		return
	}

	admin := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     "admin",
		IsActive: true,
	}

	if err := config.DB.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin berhasil dibuat dengan password default: 'Password'",
		"admin": gin.H{
			"id":    admin.ID,
			"name":  admin.Name,
			"email": admin.Email,
			"role":  admin.Role,
		},
	})
}

// DeleteUser - Soft delete user (yang dipanggil frontend saat delete biasa)
func DeleteUser(c *gin.Context) {
	// Cek role dengan cara yang sama seperti fungsi lain
	userID := c.GetUint("userID")
	var currentUser models.User
	if err := config.DB.Preload("Categories").First(&currentUser, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Status:  401,
			Message: "User tidak ditemukan",
		})
		return
	}

	// Cek apakah superadmin
	isSuperadmin := (currentUser.Role == "admin" && len(currentUser.Categories) == 0) || currentUser.Role == "superadmin"
	if !isSuperadmin {
		c.JSON(http.StatusForbidden, models.Response{
			Status:  403,
			Message: "Hanya superadmin yang dapat menghapus user",
		})
		return
	}

	id := c.Param("id")
	if err := config.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Status:  500,
			Message: "Failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Status:  200,
		Message: "User soft deleted",
	})
}

// GetDeletedUsers - PERBAIKI agar konsisten dengan models.Response
func GetDeletedUsers(c *gin.Context) {
	userID := c.GetUint("userID")
	var currentUser models.User
	if err := config.DB.Preload("Categories").First(&currentUser, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Status:  401,
			Message: "User tidak ditemukan",
		})
		return
	}

	isSuperadmin := (currentUser.Role == "admin" && len(currentUser.Categories) == 0) || currentUser.Role == "superadmin"
	if !isSuperadmin {
		c.JSON(http.StatusForbidden, models.Response{
			Status:  403,
			Message: "Hanya superadmin yang dapat melihat user terhapus",
		})
		return
	}

	var users []models.User
	if err := config.DB.Unscoped().Where("deleted_at IS NOT NULL").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Status:  500,
			Message: "Failed to fetch deleted users",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Status:  200,
		Message: "Success",
		Data:    users,
	})
}

// ToggleActiveUser - PERBAIKI response format
func ToggleActiveUser(c *gin.Context) {
	userID := c.GetUint("userID")
	var currentUser models.User
	if err := config.DB.Preload("Categories").First(&currentUser, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Status:  401,
			Message: "User tidak ditemukan",
		})
		return
	}

	isSuperadmin := (currentUser.Role == "admin" && len(currentUser.Categories) == 0) || currentUser.Role == "superadmin"
	if !isSuperadmin {
		c.JSON(http.StatusForbidden, models.Response{
			Status:  403,
			Message: "Hanya superadmin yang dapat mengubah status user",
		})
		return
	}

	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Status:  404,
			Message: "User not found",
		})
		return
	}

	user.IsActive = !user.IsActive
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Status:  500,
			Message: "Failed to update user status",
		})
		return
	}

	status := "activated"
	if !user.IsActive {
		status = "deactivated"
	}

	c.JSON(http.StatusOK, models.Response{
		Status:  200,
		Message: "User " + status,
	})
}

// RestoreUser - PERBAIKI agar konsisten
func RestoreUser(c *gin.Context) {
	userID := c.GetUint("userID")
	var currentUser models.User
	if err := config.DB.Preload("Categories").First(&currentUser, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak ditemukan"})
		return
	}

	isSuperadmin := (currentUser.Role == "admin" && len(currentUser.Categories) == 0) || currentUser.Role == "superadmin"
	if !isSuperadmin {
		c.JSON(http.StatusForbidden, gin.H{"message": "Hanya superadmin yang dapat memulihkan user"})
		return
	}

	id := c.Param("id")
	if err := config.DB.Unscoped().Model(&models.User{}).
		Where("id = ?", id).
		Update("deleted_at", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to restore user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User restored successfully"})
}

// HardDeleteUser - PERBAIKI agar konsisten
func HardDeleteUser(c *gin.Context) {
	userID := c.GetUint("userID")
	var currentUser models.User
	if err := config.DB.Preload("Categories").First(&currentUser, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User tidak ditemukan"})
		return
	}

	isSuperadmin := (currentUser.Role == "admin" && len(currentUser.Categories) == 0) || currentUser.Role == "superadmin"
	if !isSuperadmin {
		c.JSON(http.StatusForbidden, gin.H{"message": "Hanya superadmin yang dapat menghapus user permanen"})
		return
	}

	id := c.Param("id")
	if err := config.DB.Unscoped().Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to permanently delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User permanently deleted"})
}
