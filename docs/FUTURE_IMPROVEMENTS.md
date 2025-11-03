# FUTURE IMPROVEMENTS

## Overview
This document outlines proposed future improvements for the SuperApp Mobile project.

## Planned Features
- Enable user onboarding via API and Super App Portal

## Technical Enhancements
- Resolve APK issue: The `react-native-app-auth` library registers the app twice, causing two instances to appear when redirecting from the IAM service. Only one instance functions correctly; investigate and fix duplicate registration.
 - Migrate sensitive token storage from AsyncStorage to Expo SecureStore (Keychain/Keystore) for hardware‑backed protection. Replace all token reads/writes in `authService`, `microAppTokenService`, `googleService`, and `requestHandler` with a secure storage wrapper.

## UI/UX Improvements
- Implement multi-language support (For Mobile Appliction)

## Testing & Quality Assurance
- Integrate automated testing frameworks
- Define manual testing strategies
- Add runtime debug log support

<br>

---
