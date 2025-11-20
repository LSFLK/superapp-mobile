package dto

type MicroAppVersionResponse struct {
	ID           int     `json:"id"`
	MicroAppID   string  `json:"microAppId"`
	Version      string  `json:"version"`
	Build        int     `json:"build"`
	ReleaseNotes *string `json:"releaseNotes,omitempty"`
	IconURL      *string `json:"iconUrl,omitempty"`
	DownloadURL  string  `json:"downloadUrl"`
	Active       int     `json:"active"`
}

type CreateMicroAppVersionRequest struct {
	Version      string  `json:"version" validate:"required"`
	Build        int     `json:"build" validate:"required,min=1"`
	ReleaseNotes *string `json:"releaseNotes,omitempty"`
	IconURL      *string `json:"iconUrl,omitempty"`
	DownloadURL  string  `json:"downloadUrl" validate:"required"`
}
