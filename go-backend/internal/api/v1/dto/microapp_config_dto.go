package dto

import "encoding/json"

type MicroAppConfigResponse struct {
	ConfigKey   string          `json:"configKey"`
	ConfigValue json.RawMessage `json:"configValue"`
}

type CreateMicroAppConfigRequest struct {
	ConfigKey   string          `json:"configKey"`
	ConfigValue json.RawMessage `json:"configValue"`
}
