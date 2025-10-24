# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Asgardeo setup (fix callback mismatch)

If you see "Your application's callback URL does not match with the registered redirect URLs" when logging in, ensure the following:

1. Configure environment variables. Copy `.env.example` to `.env.local` and fill in values:
   - `REACT_APP_ASGARDEO_CLIENT_ID`
   - `REACT_APP_ASGARDEO_BASE_URL` (e.g., `https://api.asgardeo.io/t/<org_name>`)
   - `REACT_APP_SIGN_IN_REDIRECT_URL` (e.g., `http://localhost:3000/`)
   - `REACT_APP_SIGN_OUT_REDIRECT_URL` (e.g., `http://localhost:3000/`)

   Restart `npm start` after changes.

2. In Asgardeo Console for your application, add EXACTLY these URLs:
   - Allowed redirect URLs: `http://localhost:3000/`
   - Authorized post-logout redirect URLs: `http://localhost:3000/`

   Include any deployed URLs you will use in production as well (with the exact scheme, host, port, and path).

Notes:

- This app is served at the root path `/` in development. If you host it under a sub-path in production (e.g., `/admin/`), update both the env vars and the Asgardeo URLs accordingly (e.g., `https://example.com/admin/`).
- Create React App only exposes env vars prefixed with `REACT_APP_`.
- After updating env vars, stop and restart the dev server.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## UI styling

The admin portal uses a light-weight custom theme without external UI libraries.

- Global CSS variables and base styles live in `src/index.css`.
- Layout (navbar, container, hero) and utility classes (`btn`, `card`, `dropzone`) are defined there as well.
- App structure is in `src/App.tsx` with a top navbar and a content card wrapping the uploader.

Quick theme tweaks:

- Change primary color: update `--primary-600` and `--primary-700` in `:root`.
- Border radius: adjust `--radius`.
- Dark mode adapts automatically via `prefers-color-scheme`.

Component notes:

- Uploader supports drag & drop and file picker with success/error messaging. See `src/components/UploadExcel.jsx`.

## Payslip Upload CORS (Dev Proxy)

The payslip Excel upload calls a Choreo-hosted backend that does not include a permissive `Access-Control-Allow-Origin` header for `http://localhost:3000`, which causes browser CORS failures when developing locally.

To avoid this in development we use Create React App's proxy middleware (`src/setupProxy.js`).

How it works:

- Frontend code sends POST requests to the relative path `/api/payslips/upload`.
- The dev server intercepts those requests and proxies them to the DEV endpoint:
  `https://41200aa1-4106-4e6c-babf-311dce37c04a-dev.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/upload`
- (Earlier PROD path with `/payslips/upload` segment was replaced; backend now expects a single `/upload`.)
- Because the request is made server-to-server from the dev server, the browser's same-origin policy is not triggered.

Override target (optional):

```
PAYSLIP_API_TARGET=https://<alt-domain> npm start
```

Or place it in a local environment file (note: CRA only exposes vars starting with `REACT_APP_`, but since this var is consumed only by the Node dev server proxy, the `PAYSLIP_API_TARGET` name is fine). Do NOT rely on this proxy in production—deploy a backend or configure proper CORS/server-side calls.

Production builds:

- The compiled bundle will still point to `/api/payslips/upload` unless you change it. For production you should either:
  1.  Replace the relative path with an absolute environment-derived URL at build time, or
  2.  Serve the admin app behind a reverse proxy that forwards `/api/payslips` similarly.

If you introduce an environment-based base URL for production, add something like:

```js
const PAYSLIP_BASE = process.env.REACT_APP_PAYSLIP_API_BASE || "/api/payslips";
fetch(`${PAYSLIP_BASE}/upload`, { method: "POST", body: formData });
```

and set `REACT_APP_PAYSLIP_API_BASE` during CI/CD.

### Production (Choreo) 405 Troubleshooting

If you see `405 Method Not Allowed` and an HTML response (JSON parse failing with `Unexpected token '<'`):

1. Confirm the actual deployed backend path. Current expectation: `/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload` (POST).
2. Ensure your built app was provided `REACT_APP_PAYSLIP_API_BASE="https://<domain>/gov-superapp/microappbackendprodbranch/v1.0/admin-portal"` at build time.
3. If you served the static files without setting the env var, the JS bundle still calls `/api/payslips/upload` (dev-only proxy path) which Choreo doesn't know → 405/404 HTML.
4. Clear CDN/browser cache after redeploy so the updated bundle (with inlined env var) loads.
5. If backend path changed (e.g., now expects `/upload` under a different base) update the env var accordingly—do not edit source references again.

The `UploadExcel` component now parses non-JSON responses and shows the first 300 chars so you can see the gateway error body.

#### New local shortcut & overrides

- Local dev now also exposes a simple `/upload` route (proxy) so the component can work even if `PAYSLIP_BASE` not set.
- To bypass base logic entirely, set `REACT_APP_PAYSLIP_UPLOAD_URL` to the full absolute endpoint; it takes precedence.

Troubleshooting:

- Seeing CORS errors still? Ensure you're hitting `http://localhost:3000` (not a file:// URL) and that you restarted after adding or editing `setupProxy.js`.
- 404 from `/api/payslips/upload`? Confirm the path rewrite now maps exactly to `/gov-superapp/microappbackendprodbranch/v1.0/upload` (no `/payslips` segment). If backend still requires the old path, revert the rewrite.
- Network ECONNREFUSED locally: corporate VPN / firewall may block the Choreo host.

## Asset Attribution & Licensing

Static assets (favicons, logos, images) must have clear provenance and licenses compatible with this project's Apache-2.0 licensing. The file `public/ASSET_LICENSES.md` tracks each third-party asset.

Current open item:

- `public/download.jpeg` — source and license unknown. Replace with a vetted SVG (recommended) or document its origin + license in `ASSET_LICENSES.md` before distribution.

When adding or replacing assets:

1. Prefer vector (SVG) under MIT / Apache-2.0 / CC0.
2. Record source URL, author, license in `ASSET_LICENSES.md`.
3. Update `public/index.html` links if filenames change.
4. Remove unverified files to avoid compliance risk.

### Auth / Invoker Headers

The uploader now sends both (when authenticated):

- `x-jwt-assertion`: Asgardeo ID token from `getIDToken()` for invoker identity.
- `Authorization: Bearer <accessToken>`: Access token from `getAccessToken()` for API authorization.

If tokens can't be retrieved (not signed in or SDK error), headers are skipped and backend may reject the request.
