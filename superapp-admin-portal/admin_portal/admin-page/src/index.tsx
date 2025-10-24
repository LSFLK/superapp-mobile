/**
 * Main entry point for the Admin Portal React application
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "@asgardeo/auth-react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme } from "./theme";

const rootEl = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootEl);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={createAppTheme("light")}>
      <CssBaseline />
      <AuthProvider
        config={{
          // Production URLs (currently active for deployment)
          //signInRedirectURL: 'https://a96477cc-362b-4509-95ad-fcdb6507c34a.e1-us-east-azure.choreoapps.dev',
          //signOutRedirectURL: 'https://a96477cc-362b-4509-95ad-fcdb6507c34a.e1-us-east-azure.choreoapps.dev',
          // Local development URLs (commented out - uncomment for local dev)
          signInRedirectURL: "http://localhost:3000",
          signOutRedirectURL: "http://localhost:3000",
          clientID: "aVro3ATf5ZSglZHItEDj0Kd7M4wa",
          baseUrl: "https://api.asgardeo.io/t/lsfproject",
          scope: ["openid", "profile", "groups"],
        }}
      >
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Performance Monitoring Setup
reportWebVitals();
