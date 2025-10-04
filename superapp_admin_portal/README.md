# Admin Portal

The Admin Portal is a React-based web interface for managing micro-applications and user profiles in the SuperApp ecosystem. It provides authenticated access, micro-app upload and management, and user profile display through a clean, role-based UI.

## 📁 Project Structure

```
admin_portal/admin-page/src/
├── components/          # UI components
│   ├── common/          # Reusable building blocks
│   ├── MenuBar.jsx      # Sidebar navigation
│   ├── MicroAppManagement.jsx
│   ├── UploadMicroApp.jsx
│   └── UserProfile.jsx
├── constants/           # API endpoints and style constants
├── App.js               # Root application
├── index.js             # Entry point
└── styles               # Global & app-specific CSS
```

## 🚀 Running Locally

```bash
npm install
npm start     # start dev server
npm run build # production build
```

### Environment variables (configure in `.env`):

- `REACT_APP_MICROAPPS_LIST_URL=`
- `REACT_APP_MICROAPPS_UPLOAD_URL=`
- `REACT_APP_USERS_BASE_URL=`
- `REACT_APP_IDENTITY_PROVIDER_CLIENT_ID=`
- `REACT_APP_IDENTITY_PROVIDER_BASE_URL=`

## 🔐 Features

- OAuth2/OIDC authentication with role-based access
- Micro-app listing and upload (ZIP file)
- User profile display from identity provider + backend
- Consistent theming via centralized style system

## 📦 Deployment

- Run `npm run build` → outputs production bundle
- Configure API + auth endpoints via env vars
- Deploy static files to hosting service (e.g., Vercel, S3, Nginx)
