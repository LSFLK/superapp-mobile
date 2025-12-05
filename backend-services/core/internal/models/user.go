package models

type User struct {
	Email         string
	FirstName     string
	LastName      string
	UserThumbnail *string
	Location      *string
}
