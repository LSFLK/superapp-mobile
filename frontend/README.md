# Frontend Developer Onboarding Guide.   

## Welcome to the SuperApp Mobile Frontend.  
    
This Super App is an all-in-one platform designed to bring essential tools and services to your fingertips for a seamless mobile experience. Built with **React Native Expo**, **TypeScript**, and **Redux**, this Super App integrates secure authentication via **Asgardeo**, a micro-app architecture, and a dynamic app store for downloading and managing features.
This guide provides project setup, architecture, communication flows, and essential development practices. 
     
## 🚀 Getting Started

### Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Expo CLI**: `npm install -g @expo/cli`
- **Git** for version control
- **Xcode** (for iOS development on macOS)
- **Android Studio** (for Android development)

### Project Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd gov-sup-app/superapp-mobile/frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Fill in the required environment variables in `.env`:
   ```bash
   EXPO_PUBLIC_CLIENT_ID=<asgardeo-project-client-id>
   EXPO_PUBLIC_REDIRECT_URI=<redirect-uri>
   EXPO_PUBLIC_TOKEN_URL=https://api.asgardeo.io/t/<org>/oauth2/token
   EXPO_PUBLIC_LOGOUT_URL=https://api.asgardeo.io/t/<org>/oidc/logout
   EXPO_PUBLIC_BACKEND_BASE_URL=<backend-api-url>
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

### Available Scripts

```bash
# Start Expo development server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator/device
npm run ios

# Run on web browser
npm run web

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Redux Toolkit + Redux Persist
- **Authentication**: Asgardeo IAM (OAuth 2.0 / OIDC)
- **Storage**: AsyncStorage for local persistence
- **Styling**: React Native Paper + Custom components
- **HTTP Client**: Axios

### Project Structure

```
frontend/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx         # Root layout
│   ├── (tabs)/             # Tab navigation
│   ├── login.tsx           # Authentication screen
│   └── micro-app.tsx       # Micro-app container
├── components/             # Reusable UI components
├── services/               # API services and business logic
├── context/                # Redux store and slices
├── utils/                  # Utility functions and helpers
├── types/                  # TypeScript type definitions
├── constants/              # App constants and configuration
├── hooks/                  # Custom React hooks
└── assets/                 # Images, fonts, and other assets
```


### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `ListItem.tsx`, `Widget.tsx`)
- Screens/Pages: `kebab-case.tsx` (e.g., `app-store.tsx`, `micro-app.tsx`)
- Hooks: `camelCase.ts` (e.g., `useThemeColor.ts`)
- Services & Utils: `camelCase.ts` (e.g., `authService.ts`, `requestHandler.ts`)
- Redux Slices: `camelCaseSlice.ts` (e.g., `authSlice.ts`)
- Constants: `PascalCase.ts` (e.g., `Colors.ts`, `Constants.ts`)
   

### Key Concepts

#### SuperApp vs MicroApps

- **SuperApp**: The main container application that manages authentication, navigation, and micro-app lifecycle
- **MicroApps**: Individual web applications loaded in WebViews, each serving specific functionality
- **Bridge**: Communication layer between SuperApp and MicroApps (see `docs/BRIDGE_GUIDE.md`)

#### How Micro-Apps Work

1. Micro-apps are listed in the Super App Store.
2. Users can download micro-apps from the store.
3. Downloaded micro-apps are stored using AsyncStorage.
4. When launched, authentication tokens are exchanged for access.
5. The micro-app uses micro-app specific access tokens to communicate with the Choreo API Gateway.

<!-- #### How Micro-App Updates Work

- The Super App Store checks for updates.
- If an update is available, the micro-app is re-downloaded and replaced. -->

---
## 🔄 Super App Mobile Flow

### **High-Level Overview**

1. User installs & opens the app for the first time

   - If user **is not authenticated**, Prompt to **Sign In** is displayed.

2. If user signs in:

   - Retrieve **access_token & refresh_token** via **Asgardeo IAM**.
   - Fetch **detailed user info**.


2. Default landing tab is `Home`

   - user installed apps are shown.

3. User can navigate:

   - To **Store** tab → App management functions (install, download). 
   - To **Profile** tab → Profile details and sign-out option.


4. On re-open, the app:

   - Starts at **Home** tab.
   <!-- - Checks for a **Super App force update**. If required, shows update screen.
   - Checks if any **micro-apps have updates** and updates them automatically. -->


## 🔄 Communication Flows

### 1. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Super App
    participant IAM as Identity and Access Management (IAM) - Asgardeo
    participant Choreo as API Gateway - Choreo

    User ->> Super App: Open Mobile Application
    Super App ->> IAM: Authorize using client_id of Super App
    IAM -->> Super App: Asgardeo access_token + refresh_token
    Super App ->> Choreo: Resource Access (using IAM access_token)
    Choreo -->> Super App: Resource data
    Super App -->> User: Application loads

```

### 2. MicroApp Launch Flow

```mermaid
sequenceDiagram
    participant User
    participant SuperApp
    participant Backend
    participant MicroApp

    User ->> Super App: Open Micro App
    Super App ->> Micro App: Initiate Micro App loading
    Micro App ->> Super App: Request microapp specific access_token
    Super App ->> backend: (app_id of Micro App + user_id)
    backend -->> Super App: microapp specific access_token
    Super App -->> Micro App: Provide microapp specific access_token
    Micro App ->> Choreo: Resource Access (using microapp specific access_token)
    Choreo -->> Micro App: Resource data
    Micro App -->> User: Loads Micro App
```

---


### HTTP Client Configuration

The app uses Axios with interceptors for:

- **Request Interceptor**: Adds authorization headers
- **Response Interceptor**: Handles token refresh on 401 errors
- **Error Handling**: Centralized error processing

---

## 🔧 Development Workflow

### Code Organization

#### Components
- Use functional components with TypeScript
- Follow component naming conventions: `PascalCase`
- Separate business logic into custom hooks
- Use React Native Paper for consistent UI

#### Services
- Keep API calls in dedicated service files
- Use async/await for asynchronous operations
- Implement proper error handling
- Add TypeScript interfaces for API responses

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Code Quality

#### Linting
```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

#### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type usage
- Leverage type inference where possible

---

## 🚀 Deployment

### Build Process

1. **Development Builds**
   ```bash
   # Android APK
   npx expo prebuild --platform android --clean // To pre-build the package
   npx expo run:android --variant=debug

   # iOS Simulator
   npx expo prebuild --platform ios --clean 
   npx expo run:ios
   ```
In the output, you'll find options to open the app in a

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start development by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).   

2. **Production Builds**
   ```bash
   # Using EAS Build
   npx eas build --platform android
   npx eas build --platform ios

   # Or using Expo Application Services
   npx expo build:android
   npx expo build:ios
   ```

### Environment Management

- **Development**: Local development with hot reload
- **Staging**: Test environment for QA
- **Production**: Live environment for end users

### Release Process

1. Update version in `app.config.ts`
2. Create git tag
3. Build and submit to app stores
4. Update release notes

---

## 🐛 Debugging & Troubleshooting

### Common Issues

#### Build Issues
```bash
# Clear Expo cache
npx expo start --clear

# Clear Metro bundler cache
npx react-native start --reset-cache

# Clear node_modules and reinstall
rm -rf node_modules && npm install
```

#### Authentication Issues
- Verify environment variables are set correctly
- Check Asgardeo configuration
- Ensure redirect URIs match

#### Network Issues
- Verify API endpoints are accessible
- Check network permissions in app configuration
- Use Charles Proxy or similar for network debugging

### Development Tools

- **Expo Dev Client**: Enhanced development experience
- **React Native Debugger**: Advanced debugging capabilities
- **Flipper**: Mobile app debugging platform
- **Charles Proxy**: Network traffic inspection

---

## 📚 Additional Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Key Files to Review
- `docs/BRIDGE_GUIDE.md`: MicroApp communication
- `services/authService.ts`: Authentication logic
- `context/slices/appSlice.ts`: State management
- `utils/bridge.ts`: Bridge implementation
- `constants/Constants.ts`: App configuration

### Getting Help
- Check existing issues in the repository
- Review pull request discussions
- Reach out to the development team
- Consult the Bridge Guide for MicroApp integration

---

*This guide is maintained by the SuperApp development team. Last updated: September 2025*</content>.  
<parameter name="filePath">/superapp-mobile/docs/README.md