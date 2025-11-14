# SuperApp Deployment Guide: Onboarding for Sigirialand

Welcome to the SuperApp deployment guide! This guide will take you through the complete process of deploying a government super app for a fictional country called **Sigirialand**.

By the end of this guide, you'll have a fully functional super app running locally, with sample micro-apps deployed and ready for testing. We'll start with the government calendar app (simple frontend-only) and optionally add the payslip viewer (full-stack with backend and admin portal) for a complete end-to-end setup.

## What You'll Build

Imagine Sigirialand, a developing nation modernizing its digital government services. Government Employees need access to:

- **Government Calendar**: View public holidays, events, and important dates
<!-- - **Payslip Viewer**: Access and view salary information securely -->

These services will be delivered through a single mobile super app, where each service is a modular "micro-app" that can be updated independently.

## Step 1: Set Up Infrastructure

Sigirialand's super app requires:

- **Database**: SQL database for storing user data and micro-app metadata.
- **Identity Provider**: OAuth2/OIDC provider for user authentication and authorization

Choose your preferred infrastructure stack and start the services.

## Step 2: Configure the Identity Provider

The mobile app, super app admin portal, and micro-app admin portals require OAuth2/OIDC clients.

**Key steps:**

1. Create a realm/application for your deployment (e.g., `sigirialand-superapp`)
2. Create clients for:
   - Mobile app (public client with PKCE)
   - SuperApp admin portal (web client)
   - Micro-app admin portals (as needed)
3. Set up roles (admin, user) and create test users
4. Configure redirect URIs for your local development setup

Note :

1. for mobile app the redirect url should be entered as ,

   - for production , \<your-scheme>://\*
   - for developement , exp://\*

2. when creating users in IdP , a relevent record should be created in the database connected to superapp as well

Refer to your IdP documentation for specific steps.

## Step 3: Configure and Run Backend Services

The SuperApp backend handles user management, micro-app registry, and API orchestration. Micro-apps may also have their own backends.

**Follow this README:**

- [SuperApp Backend](../backend/README.md): Setup, environment variables, and endpoints

Configure environment files with your database and IdP settings, install dependencies, and start the services. Verify connections and health endpoints.

## Step 4: Set Up Admin Portals

Admin portals allow administrators to manage micro-apps and users.

**Follow this README:**

- [SuperApp Admin Portal](../superapp-admin-portal/README.md)

Configure environment variables, install dependencies, and start the portals. Access them via your configured URLs and log in with admin credentials.

## Step 5: Build and Deploy Sample Micro-Apps

Micro-apps are the user-facing modular services. Let's deploy Sigirialand's government services.

### Government Calendar (Simple Frontend-Only)

This demonstrates the basic micro-app deployment flow.

**Follow the README:**

- [Government Calendar](../sample-microapps/government-calendar/frontend/README.md)

Build the frontend, zip the build files and upload it via the SuperApp Admin Portal. This creates Sigirialand's first citizen-facing service.

## Step 6: Run the Mobile Frontend and Test

The mobile app brings everything together - authentication, micro-app discovery, and user interaction.

**Follow the README:**

- [SuperApp Frontend](../frontend/README.md): Mobile app setup and configuration

Configure with your IdP and backend settings, then run with Expo. Log in and test accessing the deployed micro-apps.

## Verification Steps

After completing the setup:

1. **Infrastructure**: Verify database and IdP are accessible
2. **Backends**: Check health endpoints and API responses
3. **Admin Portals**: Access admin interfaces and verify micro-app management
4. **Mobile App**: Authenticate, see micro-app list, download and interact with apps
5. **End-to-End**: Complete user flows in the deployed micro-apps

<!-- ### Payslip Viewer (Full-Stack - Optional)
For a complete end-to-end setup, deploy the payslip viewer with backend and admin components.

**Follow these READMEs:**
- [Payslip Frontend](../sample_microapps/payslip-viewer/frontend/README.md)
- [Payslip Backend](../sample_microapps/payslip-viewer/backend/README.md)
- [Payslip Admin Portal](../sample_microapps/payslip-viewer/admin-frontend/README.md)

Set up the backend, configure the admin portal, build the frontend, and upload(the zip) via the SuperApp Admin Portal. -->

## Next Steps

Congratulations! You now have a working super app for Sigirialand. To extend it:

- Add more micro-apps following the same pattern
- Configure production deployments
- Set up CI/CD pipelines
- Add monitoring and logging

<!-- Note: For a quick overview of protections this repo already provides out-of-the-box, see the Appendix: [Built-in Safety Nets](./SAFETY_NETS.md). -->
