package auth

import (
	"context"
	"net/http"
)

type contextKey string

const (
	userInfoKey    = contextKey("userInfo")
	serviceInfoKey = contextKey("serviceInfo")
)

// SetUserInfo adds the CustomJwtPayload to the request context.
func SetUserInfo(r *http.Request, userInfo *CustomJwtPayload) *http.Request {
	ctx := context.WithValue(r.Context(), userInfoKey, userInfo)
	return r.WithContext(ctx)
}

// GetUserInfo retrieves the CustomJwtPayload from the context.
func GetUserInfo(ctx context.Context) (*CustomJwtPayload, bool) {
	userInfo, ok := ctx.Value(userInfoKey).(*CustomJwtPayload)
	return userInfo, ok
}

// SetServiceInfo adds the ServiceInfo to the request context.
func SetServiceInfo(r *http.Request, serviceInfo *ServiceInfo) *http.Request {
	ctx := context.WithValue(r.Context(), serviceInfoKey, serviceInfo)
	return r.WithContext(ctx)
}

// GetServiceInfo retrieves the ServiceInfo from the context.
func GetServiceInfo(ctx context.Context) (*ServiceInfo, bool) {
	serviceInfo, ok := ctx.Value(serviceInfoKey).(*ServiceInfo)
	return serviceInfo, ok
}
