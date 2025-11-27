package core

import (
	"errors"
	"sync"
)

type FactoryFunc func() (FileService, error)

var (
	registry = make(map[string]FactoryFunc)
	mu       sync.RWMutex
)

// Register registers a file service implementation with a factory function.
func Register(serviceType string, factory FactoryFunc) {
	mu.Lock()
	defer mu.Unlock()

	if factory == nil {
		panic("fileservice: Register factory is nil")
	}
	if _, exists := registry[serviceType]; exists {
		panic("fileservice: Register called twice for service type " + serviceType)
	}

	registry[serviceType] = factory
}

// GetRegistered retrieves the factory function for a given service type.
func GetRegistered(serviceType string) FactoryFunc {
	mu.RLock()
	defer mu.RUnlock()
	return registry[serviceType]
}

// ListRegistered returns all registered service types.
func ListRegistered() []string {
	mu.RLock()
	defer mu.RUnlock()

	types := make([]string, 0, len(registry))
	for t := range registry {
		types = append(types, t)
	}
	return types
}

// NewFileService creates a FileService instance for the given service type.
func NewFileService(serviceType string) (FileService, error) {
	// Look up the factory function from the registry
	factoryFunc := GetRegistered(serviceType)
	if factoryFunc == nil {
		registered := ListRegistered()
		if len(registered) == 0 {
			return nil, errors.New("file service not registered for type: " + serviceType +
				" (no implementations are registered - did you forget to import the implementation package?)")
		}
		return nil, errors.New("file service not registered for type: " + serviceType +
			" (registered types: " + formatServiceTypes(registered) + ")")
	}

	// Call the factory function to create the service
	return factoryFunc()
}

// formatServiceTypes converts a slice of service types to a comma-separated string
func formatServiceTypes(types []string) string {
	if len(types) == 0 {
		return "none"
	}
	result := ""
	for i, t := range types {
		if i > 0 {
			result += ", "
		}
		result += t
	}
	return result
}
