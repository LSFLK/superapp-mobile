package fileservice

import (
	"errors"
	"slices"
)

type ServiceType string

const (
	ServiceTypeDB    ServiceType = "db"
	ServiceTypeAzure ServiceType = "azure"
)

var ValidServiceTypes = []ServiceType{
	ServiceTypeDB,
	ServiceTypeAzure,
}

type ServiceFactory struct{}

func NewServiceFactory() *ServiceFactory {
	return &ServiceFactory{}
}

// NewFileService creates a FileService instance based on the provided type
func (f *ServiceFactory) NewFileService(serviceType ServiceType) (FileService, error) {
	if err := ValidateServiceType(string(serviceType)); err != nil {
		return nil, err
	}

	switch serviceType {
	case ServiceTypeDB:
		return NewDBFileService(), nil
	case ServiceTypeAzure:
		return nil, errors.New("azure file service not yet implemented")
	default:
		return nil, errors.New("unknown service type: " + string(serviceType))
	}
}

// ValidateServiceType validates if the provided service type is valid
func ValidateServiceType(serviceType string) error {
	if !slices.Contains(ValidServiceTypes, ServiceType(serviceType)) {
		return errors.New("invalid service type: " + serviceType)
	}
	return nil
}
