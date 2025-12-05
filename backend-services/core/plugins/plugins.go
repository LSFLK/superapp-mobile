package plugins

import (
	// -------------------------------------------------------------------------
	// PLUGINS REGISTRY
	// Import the service implementations you want to include in the build here.
	// -------------------------------------------------------------------------

	// Default Implementations
	_ "go-backend/plugins/file-service/default-db"
	_ "go-backend/plugins/user-service/default-db"
)
