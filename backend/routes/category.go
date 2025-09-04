// package routes

// import (
// 	"project-backend/controllers"
// 	// "project-backend/middleware"

// 	"github.com/gin-gonic/gin"
// )

// func CategoryRoutes(r *gin.Engine) {
// 	// Endpoint publik
// 	r.GET("/categories", controllers.GetCategories)
// 	r.POST("/categories", controllers.CreateCategory) // protect with superadmin
// 	r.PUT("/categories/:id", controllers.UpdateCategory)
// 	r.DELETE("/categories/:id", controllers.DeleteCategory)
// }

package routes

import (
	"project-backend/controllers"
	"project-backend/middleware"

	"github.com/gin-gonic/gin"
)

func CategoryRoutes(r *gin.Engine) {
	// Endpoint publik
	r.GET("/categories", controllers.GetCategories)

	// Endpoint yang butuh superadmin
	auth := r.Group("/categories")
	auth.Use(middleware.AuthMiddleware(), middleware.UserLoaderMiddleware()) // cek token + load user
	{
		// auth.GET("", controllers.GetCategories)
		auth.POST("", controllers.CreateCategory)
		auth.PUT("/:id", controllers.UpdateCategory)
		auth.DELETE("/:id", controllers.DeleteCategory)
		auth.GET("/admins", controllers.GetAdminUsers)

	}
}
