import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@asgardeo/auth-react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { authConfig } from './config/authConfig'
import { createAppTheme } from './theme'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={createAppTheme('light')}>
      <CssBaseline />
      <AuthProvider config={authConfig}>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
