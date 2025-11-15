package auth

import (
	"context"
	"net/http"
)

type contextKey string

const (
	userInfoKey = contextKey("userInfo")
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
