package config

import (
	"fmt"
	"log"
	"project-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := "root:@tcp(127.0.0.1:3306)/pengaduan_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

	DB = db
	fmt.Println("Database connected")

	// Auto migrate tables
	DB.AutoMigrate(&models.User{}, &models.Report{}, &models.Riwayat{}, &models.Comment{}, &models.FollowUp{}, &models.Category{}, &models.BuktiFoto{})
}
