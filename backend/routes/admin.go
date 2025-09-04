package routes

import (
	"project-backend/controllers"
	"project-backend/middleware"

	"github.com/gin-gonic/gin"
)

func AdminRoutes(r *gin.Engine) {
	// Group untuk admin super
	adminGroup := r.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.UserLoaderMiddleware(), middleware.AdminMiddleware())
	{
		adminGroup.GET("/stats", controllers.GetAdminStats)
		adminGroup.GET("/report-trends", controllers.GetTrends)
		adminGroup.GET("/by-category", controllers.GetReportsByCategory)
		adminGroup.GET("/comment-trends", controllers.GetCommentTrends)
		adminGroup.GET("/folloup-trends", controllers.GetFollowupTrends)

		// Bukti Foto Management
		adminGroup.GET("/bukti-foto", controllers.GetAllBuktiFotoAdmin)
		adminGroup.GET("/bukti-foto/stats", controllers.GetBuktiFotoStats)
		adminGroup.DELETE("/bukti-foto/:id", controllers.SoftDeleteBuktiFoto)
		adminGroup.POST("/bukti-foto/:id/restore", controllers.RestoreBuktiFoto)
		adminGroup.DELETE("/bukti-foto/:id/permanent", controllers.HardDeleteBuktiFoto)

		// Report dengan semua bukti foto (termasuk yang dihapus)
		adminGroup.GET("/reports/:id/with-deleted", controllers.GetReportWithAllBuktiFoto)
	}
}
