package routes

import (
	"project-backend/controllers"
	"project-backend/middleware"

	"github.com/gin-gonic/gin"
)

func ReportRoutes(r *gin.Engine) {
	// Endpoint publik
	r.GET("/reports/public", controllers.GetLatestReports)
	r.GET("/reports/public/:id", controllers.GetPublicReportByID)

	// Endpoint total aduan (letakkan sebelum /:id)
	r.GET("/reports/total", controllers.GetTotalReports)

	// Group dengan auth
	report := r.Group("/reports")
	report.Use(middleware.AuthMiddleware())
	report.POST("", controllers.CreateReport)
	report.GET("/my", controllers.GetMyReports)
	report.GET("/all", controllers.GetAllReports)
	report.GET("/filter", controllers.GetReportsFiltered)

	// Routes komentar
	r.POST("/comments", middleware.AuthMiddleware(), controllers.CreateComment)
	r.GET("/comments/:report_id", middleware.AuthMiddleware(), controllers.GetCommentsByReport)
	r.GET("/reports/search", controllers.SearchReportByTrackingID)

	// Routes tindak lanjut
	r.POST("/followups", middleware.AuthMiddleware(), controllers.CreateFollowUp)
	r.GET("/followups/:report_id", controllers.GetFollowUpsByReport)

	// Admin khusus
	reportAdmin := report.Group("/admin")
	reportAdmin.Use(middleware.AdminMiddleware())
	reportAdmin.GET("", controllers.GetReportsAdmin)
	reportAdmin.PATCH("/:id/status", controllers.UpdateReportStatus)
	reportAdmin.PUT("/:id/status", controllers.UpdateReportStatus)
	reportAdmin.PATCH("/:id/update", controllers.UpdateReportAdmin)

	// letakkan GET /reports/:id di akhir semua route /reports
	report.GET("/:id", controllers.GetReportByID)
}
