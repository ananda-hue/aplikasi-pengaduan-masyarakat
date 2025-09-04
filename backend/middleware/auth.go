package middleware

import (
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

var jwtSecret = []byte("your_secret_key")

// AuthMiddleware untuk validasi JWT dan menyimpan informasi user ke context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Authorization header missing"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token claims"})
			c.Abort()
			return
		}

		// user_id
		idFromClaims, ok := claims["user_id"]
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User ID not found in token"})
			c.Abort()
			return
		}
		userIDFloat, ok := idFromClaims.(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User ID is not valid"})
			c.Abort()
			return
		}
		userID := uint(userIDFloat)

		// role
		role, _ := claims["role"].(string)
		adminCategory, _ := claims["admin_category"].(string)

		// categories array
		var categories []string
		if rawCats, ok := claims["categories"].([]interface{}); ok {
			for _, v := range rawCats {
				if s, ok := v.(string); ok {
					categories = append(categories, s)
				}
			}
		}

		// set ke context
		c.Set("userID", userID)
		c.Set("role", strings.TrimSpace(role))
		c.Set("admin_category", strings.TrimSpace(adminCategory))
		c.Set("categories", categories)

		c.Next()
	}
}

// AdminMiddleware mengizinkan hanya role admin, superadmin, dan kategori_admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		roleStr, ok := roleVal.(string)
		if !exists || !ok || (roleStr != "admin" && roleStr != "superadmin" && roleStr != "kategori_admin") {
			c.JSON(http.StatusForbidden, gin.H{"message": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// AdminKategoriMiddleware mengizinkan hanya admin kategori
func AdminKategoriMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		roleStr, ok := roleVal.(string)

		if !exists || !ok || roleStr != "kategori_admin" {
			c.JSON(http.StatusForbidden, gin.H{"message": "Kategori admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// AdminKategoriFilterMiddleware memastikan admin hanya akses kategori miliknya
func AdminKategoriFilterMiddleware(expectedCategory string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, _ := c.Get("role")
		categoryVal, _ := c.Get("admin_category")

		roleStr, _ := roleVal.(string)
		categoryStr, _ := categoryVal.(string)

		if roleStr == "kategori_admin" && categoryStr == expectedCategory {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, gin.H{"message": "Access to this category is forbidden"})
		c.Abort()
	}
}

// UserLoaderMiddleware memuat data user dari database dan disimpan ke context
func UserLoaderMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User ID not found in context"})
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
		c.Next()
	}
}

// SuperadminMiddleware hanya izinkan role superadmin
func SuperadminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		roleStr, ok := roleVal.(string)

		if !exists || !ok || roleStr != "superadmin" {
			c.JSON(http.StatusForbidden, gin.H{"message": "Superadmin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
