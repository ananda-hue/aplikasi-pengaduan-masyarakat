package main

import (
	"project-backend/config"
	"project-backend/routes"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.New()
	r.RedirectTrailingSlash = false
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	// Contoh jika r adalah *gin.Engine
	r.Static("/bukti_foto", "./bukti_foto")

	// Konfigurasi CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Koneksi database
	config.Connect()

	// Daftarkan route
	routes.AuthRoutes(r)
	routes.ReportRoutes(r)
	routes.UserRoutes(r)
	routes.AdminRoutes(r)
	routes.CategoryRoutes(r)

	// Jalankan server
	r.Run(":8080")
}
