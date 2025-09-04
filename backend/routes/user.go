package routes

import (
	"project-backend/controllers"
	"project-backend/middleware"

	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.Engine) {
	userGroup := r.Group("/users")
	userGroup.Use(middleware.AuthMiddleware(), middleware.UserLoaderMiddleware())
	{
		// umum
		userGroup.GET("", controllers.GetAllUsers)
		userGroup.GET("/:id", controllers.GetUserByID)
		userGroup.PUT("/:id", controllers.UpdateUser)
		userGroup.GET("/posisi", controllers.GetAdminByCategory)

		// user biasa update profil sendiri
		userGroup.PUT("/profile", controllers.UpdateProfile)
		userGroup.PUT("/password", controllers.UpdatePassword)

		// hanya superadmin
		userGroup.POST("/create-admin", controllers.CreateAdmin)

		// TAMBAHKAN route DELETE yang hilang untuk soft delete
		userGroup.DELETE("/:id", controllers.DeleteUser)

		userGroup.GET("/deleted", controllers.GetDeletedUsers)
		userGroup.PATCH("/:id/toggle-active", controllers.ToggleActiveUser)
		userGroup.PATCH("/:id/restore", controllers.RestoreUser)
		userGroup.DELETE("/:id/hard-delete", controllers.HardDeleteUser)

		// userGroup.PUT("/:id/toggle", middleware.SuperadminMiddleware(), controllers.ToggleActiveUser)
	}
}
