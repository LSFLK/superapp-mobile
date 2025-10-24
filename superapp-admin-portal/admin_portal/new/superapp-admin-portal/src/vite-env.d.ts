/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASGARDEO_CLIENT_ID: string;
  readonly VITE_ASGARDEO_BASE_URL: string;
  readonly VITE_SIGN_IN_REDIRECT_URL: string;
  readonly VITE_SIGN_OUT_REDIRECT_URL: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Support for window.configs (Choreo deployment pattern)
interface WindowConfigs {
  ASGARDEO_CLIENT_ID?: string;
  ASGARDEO_BASE_URL?: string;
  SIGN_IN_REDIRECT_URL?: string;
  SIGN_OUT_REDIRECT_URL?: string;
  API_BASE_URL?: string;
}

interface Window {
  configs?: WindowConfigs;
}
