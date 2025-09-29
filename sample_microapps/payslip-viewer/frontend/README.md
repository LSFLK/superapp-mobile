 # Payslip Viewer - Frontend

 This README describes how to develop, build, package, and prepare the payslip-viewer microapp frontend for upload to the SuperApp Admin portal. The microapp is a standalone web frontend that will be packaged as a zip and uploaded to the SuperApp Admin; the mobile app downloads and runs the microapp.


 ## Prerequisites

 - Node.js (LTS, e.g. 18.x or 20.x)
 - npm (or yarn)
 - Access to the SuperApp Admin portal to upload the packaged microapp


 ## Project structure

 Typical layout (top-level files/folders you’ll use):

 - `src/` — application source code
 - `public/` — static assets and index.html (used by the bundler)
 - `package.json` — scripts and dependencies
 - `build/` or `dist/` — production build output (created after `npm run build`)



 ## Local development

 1. Install dependencies:

	 ```bash
	 cd sample_microapps/payslip-viewer/frontend
	 npm install
	 ```

 2. Start the development server (the exact script may vary; common scripts are `start` or `dev`):

	 ```bash
	 npm start
	 # or
	 npm run dev
	 ```

 3. Open the app in your browser at the URL printed by the dev server (often `http://localhost:3000`).

 Notes:

 - If the microapp fetches APIs (e.g., payslip data), configure the API base URL using environment variables described below.

 ## Build for production

 Create a production build that will be packaged for upload to the Admin portal.

 ```bash
 npm run build
 ```

 After a successful build the production artifacts will live in the `build/` (or `dist/`) folder depending on the bundler used.

 ## Package (zip) for upload

 The Admin portal expects a zip file containing the static build output. Ensure `index.html` is at the root of the zip or at the expected path as defined by the Admin portal documentation.

 Example packaging command (from the microapp `frontend` folder):

 ```bash
 # create a zip named payslip-viewer.zip containing the build output
 zip -r payslip-viewer.zip build/
 ```

 Or to place files at the root of the zip (strip the `build/` folder path):

 ```bash
 cd build
 zip -r ../payslip-viewer.zip .
 cd -
 ```

 ## Upload via Admin portal

 1. Open the Admin portal UI (run locally or use the staging instance).
 2. Sign in with an admin user.
 3. Create a new Microapp entry (fill metadata: name, description, version) and upload `payslip-viewer.zip`.
 4. After upload, the Admin portal should inform you of success and the microapp should appear in the microapp list.
 
 ## Environment variables and configuration

 The microapp may expect runtime configuration such as API URLs or auth client IDs. Typical patterns:

 - Build-time envs (used during `npm run build`):
	- `REACT_APP_API_BASE_URL` or similar — the base URL for any backend the microapp calls.

 - Runtime config: if the Admin portal or the host provides a runtime config, the microapp should read a JSON manifest or global variable injected by the host.

 Set envs locally before running build:

 ```bash
 export REACT_APP_API_BASE_URL="http://localhost:8081/api"

 npm run build
 ```

 Adjust names above to match microapp code.
