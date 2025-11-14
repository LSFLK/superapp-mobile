<h1 align="left">Super App Mobile</h1>

<img src="./resources/snapshots.png?" alt="Snapshot Image" width="700"/>
<p align="left">
  <a href="https://opensource.org/license/apache-2-0">
    <img alt="License: Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg">
  </a>
  <!-- <a href="https://twitter.com/intent/follow?screen_name=wso2" rel="nofollow"><img src="https://img.shields.io/twitter/follow/wso2.svg?style=social&amp;label=Follow%20Us" style="max-width: 100%;"></a> -->
</p>

This open source project provides a unified platform powered by **micro app architecture**, allowing you to seamlessly integrate multiple applications within a single container.

With this approach, you can deploy multiple Web apps inside one super app while customizing its functionalities to fit your specific requirements.

This repository serves as the foundation for hosting multiple micro-apps with seamless authentication, integration, and centralized management.

---

## 🧭 Project Structure

```bash
.
├── backend/                  # Ballerina backend service for SuperApp
│   └── README.md             # Backend setup and API docs
├── frontend/                 # React Native (Expo) frontend for SuperApp
│   └── README.md             # Frontend setup and usage docs
├── superapp-admin-portal/    # React web portal for uploading and managing micro-apps
│   └── README.md             # Admin portal documentation
├── sample-microapps/         # Example micro-apps for demonstration
│   └── government-calendar/
│       ├── frontend/         # React frontend
│       └── README.md         # Micro-app documentation
└── README.md                 # Project root documentation (you're here)
```

## ⚙️ Technologies Used

### Backend

- **Language**: [Ballerina](https://ballerina.io/)

### Frontend

- **Framework**: React Native (Expo)
- **State Management**: Redux Toolkit + Redux Persist

### Authentication

- External identity provider (OIDC/OAuth2 compatible)

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
4. (if required) When launched, microapp specific tokens are issued by the superapp for access.
5. The micro-app uses micro-app specific access tokens to communicate with the respective backends.

## 🚀 Getting Started

Each part of this repository has its own setup guide. Pick the guide that matches what you want to do:

### End-to-End Setup

- **[Super App Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)**: Step-by-step instructions for setting up the entire SuperApp stack locally, including infrastructure (database, IdP), configuration. Ideal for new contributors or those working on the complete system.

### Component-Specific Development

- **SuperApp Core Deployer** (main app, backend, admin portal):

  - [Frontend Setup](./frontend/README.md): React Native mobile app development and local testing
  - [Backend Setup](./backend/README.md): Ballerina API service development
  - [Admin Portal Setup](./superapp-admin-portal/README.md): Web portal for managing micro-apps

- **Micro-App Developers** (third-party or in-house apps):
  - [Micro-App Developer Guide](./frontend/docs/MICROAPP_DEVELOPER_GUIDE.md): Building, integrating, and deploying micro-apps within the SuperApp
  - [Sample Micro-Apps](./sample-microapps/): Reference implementations and examples

## 🐞 Reporting Issues

### Opening an issue

All known issues of Open Super App Mobile are filed at: https://github.com/LSFLK/superapp-mobile/issues. Please check this list before opening a new issue.

### Next steps & future improvements

Read the planned enhancements and longer-term tasks in [FUTURE_IMPROVEMENTS.md](./docs/FUTURE_IMPROVEMENTS.md).

## 🤝 Contributing

If you are planning on contributing to the development efforts of Open Superapp Mobile, you can do so by checking out the latest development version. The main branch holds the latest unreleased source code.

## 📡 Observability (OpenTelemetry Metrics)

The mobile app sends performance metrics to an OpenTelemetry Collector, which exports to Prometheus.

### Quick Start (Local Development)

```sh
cd observability
docker compose up -d
```

View metrics at **http://localhost:9090** (Prometheus)

### Configure the App

Set in `frontend/.env`:

```
EXPO_PUBLIC_OTEL_ENABLED=true
EXPO_PUBLIC_OTEL_COLLECTOR_URL=http://10.0.2.2:4318
```

### Metrics Available

- `api_request_count_total`, `api_request_duration_bucket`
- `microapp_load_count_total`, `microapp_load_duration_bucket`
- `auth_token_refresh_count_total`
- `app_start_time_bucket`

See `observability/README.md` for details.
