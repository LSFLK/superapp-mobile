<h1 align="left">Super App Mobile</h1>

<img src="./resources/snapshots.png" alt="Architecture Diagram" width="700"/>
<br></br>
<p align="left">
  <a href="https://opensource.org/license/apache-2-0">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg">
  </a>
</p>
<!-- Credit line acknowledging WSO2 Superapp -->
<p style="margin-top: 0.5rem;"><em>Originally adapted from and inspired by the <a href = "https://github.com/wso2-open-operations/superapp-mobile"> WSO2 Superapp project</a>.</em></p>
This repository is the foundation for hosting and managing many small web-based micro-apps with seamless authentication, secure token exchange, and centralized management. Micro-apps run inside the host app and communicate with it using a lightweight, reliable bridge, making onboarding and integration straightforward for both in-house and third‑party apps.


## 🧭 Project Structure

```bash
.
├── backend/                  # Ballerina backend service for SuperApp
│   └── README.md             # Backend setup and API docs
├── frontend/                 # React Native (Expo) frontend for SuperApp
│   └── README.md             # Frontend setup and usage docs
├── admin_portal/             # React web portal for uploading and managing micro-apps
│   └── README.md             # Admin portal documentation
├── sample_microapps/         # Example micro-apps for demonstration
│   ├── payslip-viewer/
│   │   ├── frontend/         # React frontend
│   │   ├── backend/          # Ballerina backend
│   │   ├── admin-frontend/   # React Admin interface for uploading payslips
│   │   └── README.md         # Micro-app documentation
│   └── government-calender/
│       ├── frontend/         # React frontend
│       └── README.md         # Micro-app documentation
└── README.md                 # Project root documentation (you're here)
```

## ⚙️ Technologies Used

### Backend
- **Language**: [Ballerina](https://ballerina.io/)
- **Authentication**: External identity provider (OIDC/OAuth2 compatible)

### Frontend
- **Framework**: React Native (Expo)
- **State Management**: Redux with Thunk


## 🧱 System Architecture

Here’s a high-level view of the flow:
<br></br>
<img src="./resources/architecture_diagram.png?" alt="Architecture Diagram" width="700"/>

## 🧱 Authentication Flow
<img src="./resources/auth_flow.png?" alt="Authentication Flow Diagram" width="700"/>


### Key Concepts

#### SuperApp vs MicroApps

- **SuperApp**: The main container application that manages authentication, navigation, and micro-app lifecycle
- **MicroApps**: Individual web applications loaded in WebViews, each serving specific functionality
- **Bridge**: Communication layer between SuperApp and MicroApps (see `frontend/docs/BRIDGE_GUIDE.md`)

#### How Micro-Apps Work

1. Micro-apps are listed in the Super App Store.
2. Users can download micro-apps from the store.
3. Downloaded micro-apps are stored using AsyncStorage.
4. When launched, authentication tokens are exchanged for access.
5. The micro-app uses micro-app specific access tokens to communicate with the domain specific backends.
    

## 🚀 Getting Started


Each part of this repository has its own setup guide. Pick the guide that matches what you want to do:

### End-to-End Setup
- **[Developer Onboarding Guide](./docs/ONBOARDING.md)**: Step-by-step instructions for setting up the entire SuperApp stack locally, including infrastructure (database, IdP), configuration. Ideal for new contributors or those working on the complete system.

### Component-Specific Development
- **SuperApp Core Deployer** (main app, backend, admin portal):
  - [Frontend Setup](./frontend/README.md): React Native mobile app development and local testing
  - [Backend Setup](./backend/README.md): Ballerina API service development
  - [Admin Portal Setup](./superapp_admin_portal/README.md): Web portal for managing micro-apps

- **Micro-App Developers** (third-party or in-house apps):
  - [Micro-App Developer Guide](./frontend/docs/MICROAPP_DEVELOPER_GUIDE.md): Building, integrating, and deploying micro-apps within the SuperApp
  - [Sample Micro-Apps](./sample_microapps/): Reference implementations and examples
  
## 🐞 Reporting Issues

### Opening an issue

All known issues of LSF Superapp Mobile are filed at: https://github.com/LSFLK/superapp-mobile/issues. Please check this list before opening a new issue.

### Next steps & future improvements

Read the planned enhancements and longer-term tasks in [FUTURE_IMPROVEMENTS.md](./docs/FUTURE_IMPROVEMENTS.md).

<!-- ### 2.  Reporting security issues

Please do not report security issues via GitHub issues. Instead, follow the [WSO2 Security Vulnerability Reporting Guidelines](https://security.docs.wso2.com/en/latest/security-reporting/vulnerability-reporting-guidelines/). -->



## 🤝 Contributing

If you are planning on contributing to the development efforts of LSF Superapp Mobile, you can do so by checking out the latest development version. The main branch holds the latest unreleased source code.


