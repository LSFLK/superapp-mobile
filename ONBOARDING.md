## Onboarding — superapp-mobile (main orchestration guide)

This document is the single, authoritative onboarding and orchestration guide for developers who want to build, deploy, and test the entire SuperApp stack end-to-end on a local machine (or in a staging environment).

Per-component READMEs still contain the build details for each component (backend, frontend, admin portal, microapps). This main doc explains the order, shared configuration, common environment variables, verification steps, and how to wire everything together for an end-to-end run.

If the component READMEs change, update this orchestration guide accordingly.

## Top-level orchestration — step-by-step (local dev)

Summary order (do these steps in order):

1. Start infrastructure: Database and Identity Provider(IdP).
2. Configure IdP clients and create test users / roles.
3. Configure local environment files for backend, frontend, and admin portal.
4. Run backend services.
5. Run Admin portal.
6. Build and upload a sample microapp (payslip-viewer) via Admin portal.
7. Run mobile frontend (Expo / dev client), download microapp and test flows.

Below are detailed instructions for each step, with example commands.

### 1) Start infrastructure services (Database + IdP)

SuperApp Backend and MicroApp Backends need DB and their frontends need an IdP to authenticate users.

### 2) Configure the IdP

The mobile app, super app admin portal, micro app admin portal expect an OAuth2/OIDC provider.

Key steps

1. Log in to the console.
2. Create a new Realm/Application (e.g., `superapp-dev`).
3. Create a Client for the mobile app:
     - Client ID: `superapp-mobile-client`
     - Client Protocol: `openid-connect`
     - Access Type: `public` (for native clients using PKCE)
     - Valid Redirect URIs: `govsupapp://*` (for production build), `exp://*`(to test with expo go)
     - Direct Access Grants: enable / configure as required.
4. Create a Client for the Admin Portal (web client):
     - Client ID: `superapp-admin-client`
     - Access Type: `public` or `confidential` depending on your setup; configure redirect URIs `http://localhost:3001/` (example)
5. Add Roles (e.g., admin, user) and create test users assigning those roles.
6. Do step 4, 5 to microapp(payslip-viewer) admin portal as well

<p><span style="color: red;">Important : Need add user information in the database that connected to superapp backend as well </span></p>

Notes: If your org uses another IdP (Auth0, Asgardeo), create equivalent clients and map redirect URIs accordingly.


### 3) Prepare local configuration files (envs) and Run Backend Services

Services read local configs for DB, IdP, and client IDs.

see for 
- [superapp-frontend](./frontend/README.md)
- [superapp-backend](./backend/README.md)
- [payslip-backend](./sample_microapps/payslip-viewer/backend/README.md)
- [payslip-frontend](./sample_microapps/payslip-viewer/frontend/README.md)

Verify:

- Check logs for successful DB connection and that the server listens on the expected port.
- If a health or metadata endpoint exists (e.g., `/health`), curl it.


### 4) Deploy and Run the Admin portal
see
- [payslip-admin-portal](./sample_microapps/payslip-viewer/admin_portal/README.md)
- [superapp-admin-portal](./superapp_admin_portal/README.md)

### 5) Build & upload a sample microapp (payslip-viewer)

Microapps are the user-facing modular apps; upload one to exercise the full pipeline.

In the Admin portal UI: create a new Microapp and build and upload payslip-viewer frontend.


### 6) Run the mobile app and test end-to-end

The mobile app should authenticate users, fetch microapp list, download and open microapps, and let users interact with them.

