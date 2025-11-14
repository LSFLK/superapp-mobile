package dto

type MicroAppResponse struct {
	AppID       string                    `json:"appId"`
	Name        string                    `json:"name"`
	Description *string                   `json:"description,omitempty"`
	IconURL     *string                   `json:"iconUrl,omitempty"`
	Active      int                       `json:"active"`
	Mandatory   int                       `json:"mandatory"`
	Versions    []MicroAppVersionResponse `json:"versions,omitempty"`
}

type CreateMicroAppRequest struct {
	AppID       string                         `json:"appId"`
	Name        string                         `json:"name"`
	Description *string                        `json:"description,omitempty"`
	IconURL     *string                        `json:"iconUrl,omitempty"`
	Mandatory   int                            `json:"mandatory"`
	Versions    []CreateMicroAppVersionRequest `json:"versions,omitempty"`
}
