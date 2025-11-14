package database

import (
	"fmt"
	"log"

	"go-backend/internal/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=True",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get DB instance: %v", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)

	log.Println("Database connected successfully")
	return db
}

func Close(db *gorm.DB) {
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}
}
