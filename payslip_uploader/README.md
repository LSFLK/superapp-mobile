# Payslip Uploader Frontend

A minimal standalone React app to upload payslip Excel/CSV files to the backend and view uploaded payslip data in a table.

## Features
- Sign in via Asgardeo (optional wiring placeholder).
- Drag & drop or select Excel/CSV.
- Converts XLS/XLSX to CSV via `xlsx` library.
- Sends as multipart/form-data to configured endpoint.
- Basic success/error modal feedback.
- **NEW:** View all uploaded payslips in a searchable table below the upload section.
- **NEW:** Auto-refresh table after successful uploads.

## Environment Variables
Create a `.env` file:
```
REACT_APP_PAYSLIP_UPLOAD_ENDPOINT=https://example.com/admin-portal/upload
REACT_APP_PAYSLIP_VIEW_ENDPOINT=https://example.com/admin-portal/payslips
REACT_APP_ASGARDEO_BASE_ORG=...
REACT_APP_ASGARDEO_CLIENT_ID=...
REACT_APP_ASGARDEO_SIGN_IN_REDIRECT_URL=http://localhost:3001
REACT_APP_ASGARDEO_SIGN_OUT_REDIRECT_URL=http://localhost:3001
```

## Scripts
- `npm start` – dev server on port 3001 (configure below)
- `npm run build` – production build

## Dev Port
Change port by creating `.env.development` with:
```
PORT=3001
```

## Minimal Hardening
This starter mirrors the hardened parsing & content-type checks from the admin portal.
