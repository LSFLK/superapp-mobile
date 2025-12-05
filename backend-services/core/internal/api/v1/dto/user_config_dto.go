package dto

import "encoding/json"

type UserConfigResponse struct {
	Email       string          `json:"email"`
	ConfigKey   string          `json:"configKey"`
	ConfigValue json.RawMessage `json:"configValue"`
	Active      int             `json:"active"`
}

type UpsertUserConfigRequest struct {
	ConfigKey   string          `json:"configKey" validate:"required"`
	ConfigValue json.RawMessage `json:"configValue" validate:"required"`
	Active      int             `json:"active"`
}
