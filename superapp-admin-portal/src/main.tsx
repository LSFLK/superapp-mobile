import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@asgardeo/auth-react";
import { CssBaseline } from "@mui/material";
import { authConfig } from "./config/authConfig";
import { ThemeProvider, NotificationProvider } from "./context";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider config={authConfig}>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
);
