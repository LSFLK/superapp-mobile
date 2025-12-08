package dto

type MicroAppResponse struct {
	AppID       string                    `json:"appId"`
	Name        string                    `json:"name"`
	Description *string                   `json:"description,omitempty"`
	IconURL     *string                   `json:"iconUrl,omitempty"`
	Active      int                       `json:"active"`
	Mandatory   int                       `json:"mandatory"`
	Versions    []MicroAppVersionResponse `json:"versions,omitempty"`
	Roles       []MicroAppRoleResponse    `json:"roles,omitempty"`
	Configs     []MicroAppConfigResponse  `json:"configs,omitempty"`
}

type CreateMicroAppRequest struct {
	AppID       string                         `json:"appId" validate:"required"`
	Name        string                         `json:"name" validate:"required"`
	Description *string                        `json:"description,omitempty"`
	IconURL     *string                        `json:"iconUrl,omitempty"`
	Mandatory   int                            `json:"mandatory"`
	Versions    []CreateMicroAppVersionRequest `json:"versions,omitempty" validate:"omitempty,dive"`
	Roles       []CreateMicroAppRoleRequest    `json:"roles,omitempty" validate:"omitempty,dive"`
	Configs     []CreateMicroAppConfigRequest  `json:"configs,omitempty" validate:"omitempty,dive"`
}
