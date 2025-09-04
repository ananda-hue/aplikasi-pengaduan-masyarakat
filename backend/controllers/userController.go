package controllers

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetAllUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Preload("Reports").Preload("Categories").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Status:  500,
			Message: "Error fetching users",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Status:  200,
		Message: "Success",
		Data:    users,
	})
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	result := config.DB.Preload("Reports").Preload("Categories").First(&user, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.Response{
			Status:  404,
			Message: "User not found",
		})
		return
	}

	// DEBUG: Log user data untuk melihat field is_active
	// log.Printf("User ID: %d, Name: %s, Email: %s, IsActive: %v",
	// 	user.ID, user.Name, user.Email, user.IsActive)

	c.JSON(http.StatusOK, models.Response{
		Status:  200,
		Message: "Success",
		Data:    user,
	})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	currentRoleVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"message": "Role not found: akses ditolak"})
		return
	}

	currentRole, ok := currentRoleVal.(string)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"message": "Role tidak valid"})
		return
	}
	currentRole = strings.ToLower(strings.TrimSpace(currentRole))

	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Role  string `json:"role"`
		// Hilangkan CategoryID, karena user tidak punya field ini lagi
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	// update field umum
	user.Name = input.Name
	user.Email = input.Email

	if currentRole == "superadmin" {
		if input.Role != "" {
			user.Role = input.Role
		}
	} else if currentRole == "admin" {
		if input.Role == "admin" || input.Role == "user" {
			user.Role = input.Role
		}
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated", "user": user})
}

// func DeleteUser(c *gin.Context) {
// 	id := c.Param("id")
// 	if err := config.DB.Delete(&models.User{}, id).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete user"})
// 		return
// 	}
// 	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
// }

func UserLoaderMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User not found in context"})
			c.Abort()
			return
		}
		userID, ok := userIDVal.(uint)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid user ID"})
			c.Abort()
			return
		}

		var user models.User
		if err := config.DB.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User not found"})
			c.Abort()
			return
		}

		c.Set("currentUser", user)
		// c.Set("role", user.Role)
		c.Next()
	}
}

// Get admin by category (title)
func GetAdminByCategory(c *gin.Context) {
	categoryIDStr := c.Query("category_id")
	if categoryIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "category_id parameter is required"})
		return
	}

	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid category_id"})
		return
	}

	var admin models.User
	err = config.DB.Joins("JOIN categories ON categories.user_id = users.id").
		Where("users.role = ? AND categories.id = ?", "admin", categoryID).
		First(&admin).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Admin untuk kategori tersebut tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"name": admin.Name})
}
