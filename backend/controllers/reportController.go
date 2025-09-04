package controllers

import (
	"fmt"
	"net/http"
	"project-backend/config"
	"project-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func generateTrackingID() string {
	tanggal := time.Now().Format("060102")                         // YYMMDD
	random := strconv.Itoa(1000 + int(time.Now().UnixNano()%9000)) // 4-digit random
	return "YK" + tanggal + random
}

// GET /reports/search?tracking_id=YK2408021234
func SearchReportByTrackingID(c *gin.Context) {
	trackingID := c.Query("tracking_id")
	if trackingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Tracking ID tidak boleh kosong"})
		return
	}

	var report models.Report
	if err := config.DB.
		Preload("User").
		Preload("Riwayat").
		Preload("Comments").
		Preload("FollowUps").
		Where("tracking_id = ?", trackingID).
		First(&report).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Laporan tidak ditemukan dengan Tracking ID tersebut"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

func CreateReport(c *gin.Context) {
	title := c.PostForm("title")
	wilayah := c.PostForm("wilayah")
	lokasi := c.PostForm("lokasi")
	description := c.PostForm("description")
	isAnonStr := c.PostForm("is_anonymous")
	latStr := c.PostForm("latitude")
	lonStr := c.PostForm("longitude")

	isAnonymous := isAnonStr == "true" || isAnonStr == "1"

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "UserID not found in context"})
		return
	}
	userID := userIDVal.(uint)

	latitude, errLat := strconv.ParseFloat(latStr, 64)
	longitude, errLon := strconv.ParseFloat(lonStr, 64)
	if errLat != nil || errLon != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid latitude or longitude"})
		return
	}

	// handle file upload
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to get multipart form"})
		return
	}

	files := form.File["photo"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Minimal 1 foto wajib diupload"})
		return
	}
	if len(files) > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Maximum 3 photos allowed"})
		return
	}

	// parse category
	catIDStr := c.PostForm("category_id")
	var catID *uint
	if catIDStr != "" {
		parsed, err := strconv.ParseUint(catIDStr, 10, 64)
		if err == nil {
			tmp := uint(parsed)
			catID = &tmp
		}
	}

	// create report dulu
	report := models.Report{
		TrackingID:  generateTrackingID(),
		IsAnonymous: isAnonymous,
		Title:       title,
		Wilayah:     wilayah,
		Lokasi:      lokasi,
		Latitude:    latitude,
		Longitude:   longitude,
		Description: description,
		Status:      "Diajukan",
		UserID:      userID,
		CategoryID:  catID,
	}

	if err := config.DB.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create report", "error": err.Error()})
		return
	}

	// simpan foto ke tabel bukti_fotos
	for _, file := range files {
		filename := time.Now().Format("20060102150405") + "_" + file.Filename
		photoPath := "bukti_foto/" + filename
		if err := c.SaveUploadedFile(file, photoPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save photo", "error": err.Error()})
			return
		}

		bukti := models.BuktiFoto{
			ReportID: report.ID,
			PhotoURL: photoPath,
		}
		config.DB.Create(&bukti)
	}

	// buat riwayat awal otomatis
	riwayat := models.Riwayat{
		ReportID:  report.ID,
		Status:    "Diajukan",
		Tanggal:   time.Now(),
		Deskripsi: fmt.Sprintf("Pengaduan telah diterima dan terdaftar dalam sistem oleh Pemerintah wilayah %s", wilayah),
	}
	config.DB.Create(&riwayat)

	c.JSON(http.StatusOK, gin.H{"message": "Report created", "data": report})
}

// User melihat laporan miliknya
func GetMyReports(c *gin.Context) {
	userID, _ := c.Get("userID")
	var reports []models.Report

	if err := config.DB.
		Where("user_id = ?", userID).
		Preload("User").
		Preload("BuktiFotos").
		Order("created_at DESC").
		Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil laporan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// User melihat semua laporan publik (status apapun)
func GetAllReports(c *gin.Context) {
	var reports []models.Report

	if err := config.DB.Preload("User").Preload("BuktiFotos").Order("created_at desc").Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data laporan"})
		return
	}

	// Jika laporan anonim, sembunyikan identitas user
	for i := range reports {
		if reports[i].IsAnonymous {
			reports[i].User.Name = "Anonim"
			reports[i].User.Email = ""
		}
	}

	c.JSON(http.StatusOK, reports)
}

func GetLatestReports(c *gin.Context) {
	var reports []models.Report
	if err := config.DB.
		Preload("User").
		Preload("BuktiFotos").
		Order("created_at DESC").
		Limit(8).
		Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil laporan terbaru"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// Admin melihat semua laporan
func GetReportsAdmin(c *gin.Context) {
	var reports []models.Report

	roleVal, _ := c.Get("role")
	role := roleVal.(string)

	userIDVal, _ := c.Get("userID")
	var admin models.User
	if err := config.DB.First(&admin, userIDVal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data admin"})
		return
	}

	db := config.DB.Preload("User").Order("created_at DESC")

	if role != "superadmin" && role != "kategori_admin" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Unauthorized"})
		return
	}

	if err := db.Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil laporan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// Admin update status laporan
// Admin update status laporan
func UpdateReportStatus(c *gin.Context) {
	id := c.Param("id")
	var report models.Report

	// Ambil data laporan
	if err := config.DB.First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report not found"})
		return
	}

	// Ambil input dari admin
	var input struct {
		Status    string `json:"status"`
		Deskripsi string `json:"deskripsi"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	// Validasi status
	validStatuses := map[string]bool{
		"Diajukan": true,
		"Diproses": true,
		"Selesai":  true,
		"Ditolak":  true,
	}

	if !validStatuses[input.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid status"})
		return
	}

	// Update status laporan
	report.Status = input.Status
	if err := config.DB.Save(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed update report status"})
		return
	}

	// Deskripsi otomatis jika admin tidak mengisi
	var deskripsi string
	if input.Deskripsi != "" {
		deskripsi = input.Deskripsi
	} else {
		switch input.Status {
		case "Diajukan":
			deskripsi = fmt.Sprintf("Pengaduan telah diterima dan terdaftar dalam sistem oleh Pemerintah wilayah %s", report.Wilayah)
		case "Diproses":
			deskripsi = fmt.Sprintf("Aduan sedang dalam tahap penanganan oleh tim teknis wilayah %s", report.Wilayah)
		case "Selesai":
			deskripsi = fmt.Sprintf("Aduan telah ditanggapi dan diselesaikan oleh tim wilayah %s", report.Wilayah)
		case "Ditolak":
			deskripsi = "Aduan tidak dapat diproses karena kekurangan data pendukung"
		default:
			deskripsi = "Status laporan diperbarui"
		}
	}

	// Simpan riwayat baru
	riwayat := models.Riwayat{
		ReportID:  report.ID,
		Status:    input.Status,
		Tanggal:   time.Now(),
		Deskripsi: deskripsi,
	}

	config.DB.Create(&riwayat)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status & riwayat updated",
		"data":    report,
	})
}

func GetReportsFiltered(c *gin.Context) {
	var reports []models.Report
	filter := c.Query("filter")
	monthParam := c.Query("month")
	db := config.DB.Preload("User").Preload("Category") //tambhan ini

	roleVal, _ := c.Get("role")
	role := roleVal.(string)

	userIDVal, _ := c.Get("userID")
	var admin models.User
	if err := config.DB.First(&admin, userIDVal).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Admin tidak ditemukan"})
		return
	}

	// Filter waktu berdasarkan query param bulan atau filter
	if monthParam != "" {
		layout := "2006-01"
		start, err := time.Parse(layout, monthParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Format bulan salah. Gunakan format YYYY-MM"})
			return
		}
		end := start.AddDate(0, 1, 0)
		db = db.Where("created_at >= ? AND created_at < ?", start, end)
	} else {
		switch filter {
		case "today":
			start := time.Now().Truncate(24 * time.Hour)
			db = db.Where("created_at >= ?", start)
		case "week":
			now := time.Now()
			weekday := int(now.Weekday())
			if weekday == 0 {
				weekday = 7
			}
			start := now.AddDate(0, 0, -weekday+1).Truncate(24 * time.Hour)
			db = db.Where("created_at >= ?", start)
		case "month":
			now := time.Now()
			start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
			db = db.Where("created_at >= ?", start)
		}
	}

	if role == "admin" {
		var categories []models.Category
		if err := config.DB.Where("user_id = ?", admin.ID).Find(&categories).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil kategori admin"})
			return
		}

		var categoryIDs []uint
		for _, cat := range categories {
			categoryIDs = append(categoryIDs, cat.ID)
		}

		if len(categoryIDs) > 0 {
			db = db.Where("category_id IN ?", categoryIDs)
		} else {
		}
	}

	if err := db.Order("created_at DESC").Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil laporan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// controllers/report.go
func GetReportByID(c *gin.Context) {
	var report models.Report
	id := c.Param("id")
	if err := config.DB.
		Preload("User").
		Preload("BuktiFotos").
		Preload("Category").
		Preload("Riwayat"). // ← INI YANG PENTING!
		First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Laporan tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": report})
}

func GetPublicReportByID(c *gin.Context) {
	var report models.Report
	id := c.Param("id")

	if err := config.DB.
		Preload("User").
		Preload("Category").
		Preload("Riwayat").
		Preload("Comments").
		Preload("FollowUps").
		First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Laporan tidak ditemukan"})
		return
	}

	// Sembunyikan identitas jika anonim
	if report.IsAnonymous {
		report.User.Name = "Anonim"
		report.User.Email = ""
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

func UpdateReportAdmin(c *gin.Context) {
	// Ambil report id dari param
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid report ID"})
		return
	}

	// Cari report
	var report models.Report
	if err := config.DB.First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Report not found"})
		return
	}

	// Body request (opsional semua)
	var body struct {
		Title       *string  `json:"title"`
		CategoryID  *uint    `json:"category_id"`
		Description *string  `json:"description"`
		Wilayah     *string  `json:"wilayah"`
		Lokasi      *string  `json:"lokasi"`
		Latitude    *float64 `json:"latitude"`  // tambah ini
		Longitude   *float64 `json:"longitude"` // tambah ini
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	// Update hanya field yang dikirim
	if body.Title != nil {
		report.Title = *body.Title
	}
	if body.CategoryID != nil {
		report.CategoryID = body.CategoryID
	}
	if body.Description != nil {
		report.Description = *body.Description
	}
	if body.Wilayah != nil {
		report.Wilayah = *body.Wilayah
	}
	if body.Lokasi != nil {
		report.Lokasi = *body.Lokasi
	}
	if body.Latitude != nil {
		report.Latitude = *body.Latitude
	}
	if body.Longitude != nil {
		report.Longitude = *body.Longitude
	}

	// Save ke DB
	if err := config.DB.Save(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Report updated successfully", "data": report})
}
