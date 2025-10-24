UploadMicroApp component

- Fields: name, version, appId, optional iconUrlPath, and ZIP file selector / drag-n-drop
- Posts multipart/form-data to `${REACT_APP_MICROAPPS_BASE_URL||http://localhost:9090}/micro-apps/upload`
- Expects backend to parse parts named: zipFile, name, version, appId, iconUrlPath
- Shows success/error modal

Environment variable override

- Create `.env` in project root or `src/.env` for CRA you must use `REACT_APP_` prefix, for example:

REACT_APP_MICROAPPS_BASE_URL="http://localhost:9090"

Auth

- If backend requires auth, extend the fetch to include headers like `Authorization: Bearer <token>` using Asgardeo SDK `ctx.getAccessToken()`.
