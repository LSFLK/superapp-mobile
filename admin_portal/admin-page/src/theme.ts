/**
 * App Theme (Material UI v6)
 *
 * Central place for color tokens and MUI theme options. Prefer using values from the theme
 * via `useTheme()` or the `sx` prop instead of hardcoded styles.
 */

import { PaletteMode } from "@mui/material";
import { alpha, createTheme, Theme } from "@mui/material/styles";

// Color Design Tokens (light/dark)
export const tokens = (mode: PaletteMode) =>
  mode === "dark"
    ? {
        grey: {
          100: "#d1d3d4",
          200: "#a8abad",
          300: "#7f8285",
          400: "#5a5d61",
          500: "#444a4e",
          600: "#363b40",
          700: "#2a2d31",
        },
        primary: {
          // Darkened versions of our brand blues for dark surfaces
          100: "#c6d7e6",
          200: "#8fb3d2",
          300: "#5d86a9",
          400: "#2f5f88",
          500: "#234c6d",
          600: "#1a3952",
        },
        secondary: {
          100: "#d6e6f4",
          200: "#a8c9ea",
          300: "#7aaee0",
          400: "#4b92d6",
          500: "#2d75b6",
        },
        success: { 100: "#4caf50" },
        warning: { 100: "#a89a63" },
        error: { 100: "#fe4336" },
        gradient: "linear-gradient(to bottom, #363b40, #2a2d31)",
      }
    : {
        grey: {
          100: "#ffffff",
          200: "#f5faff",
          300: "#e3f2ff",
          400: "#d1e9ff",
          500: "#b7ddff",
          600: "#95c8f3",
          700: "#6aaee0",
        },
        primary: {
          // Brand blues derived from existing COLORS in constants/styles
          100: "#e6eff6",
          200: "#c2d6e6",
          300: "#09589c", // secondary brand used for emphasis
          400: "#003a67", // primary brand
          500: "#002a4d",
        },
        secondary: {
          100: "#f0f7ff",
          200: "#cfe7ff",
          300: "#95c8f3",
          400: "#6aaee0",
          500: "#368fcd",
        },
        success: { 100: "#059669" },
        warning: { 100: "#d97706" },
        error: { 100: "#b91c1c" },
        gradient:
          "linear-gradient(135deg, #f9fcff 0%, #e6f4ff 60%, #d9edff 100%)",
      };

// Extend background type to include custom surfaces
declare module "@mui/material/styles" {
  interface TypeBackground {
    form?: string;
    banner?: string;
    autocomplete?: string;
    dataGrid?: string;
    layout?: string;
    gradient?: string;
  }

  interface PaletteOptions {
    background?: Partial<TypeBackground>;
  }
}

// Theme Options factory
export const themeSettings = (mode: PaletteMode) => {
  const c = tokens(mode);

  return {
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: {
              main: c.primary[300],
              dark: c.primary[500],
            },
            secondary: {
              main: c.secondary[300],
              dark: c.secondary[500],
            },
            success: { main: c.success[100] },
            warning: { main: c.warning[100] },
            error: { main: c.error[100] },
            background: {
              default: c.grey[700],
              paper: c.grey[600],
              form: c.grey[600],
              banner: c.primary[400],
              autocomplete: c.grey[400],
              dataGrid: c.grey[500],
              layout: c.grey[100],
              gradient: c.gradient,
            },
          }
        : {
            primary: {
              main: c.primary[400],
              dark: c.primary[500],
            },
            secondary: {
              main: c.secondary[500],
              dark: c.secondary[400],
            },
            success: { main: c.success[100] },
            warning: { main: c.warning[100] },
            error: { main: c.error[100] },
            background: {
              default: c.grey[100],
              paper: c.grey[200],
              form: c.grey[200],
              banner: c.primary[200],
              autocomplete: c.grey[400],
              dataGrid: c.grey[300],
              layout: c.grey[100],
              gradient: c.gradient,
            },
          }),
    },
    typography: {
      fontSize: 14,
      fontFamily: [
        "Poppins",
        "Inter",
        "system-ui",
        "Segoe UI",
        "sans-serif",
      ].join(","),
      h1: { fontSize: 38, fontWeight: 700 },
      h2: { fontSize: 32, fontWeight: 600 },
      h3: { fontSize: 24, fontWeight: 500 },
      h4: { fontSize: 20 },
      h5: { fontSize: 16 },
      h6: { fontSize: 14 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides:
          mode === "dark"
            ? // Autofill color fix on dark background
              `input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px ${c.grey[700]} inset !important; }`
            : `input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px ${c.grey[100]} inset !important; }`,
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            backgroundColor: "#09589c",
            "&:hover": { backgroundColor: "#0b5fa8" },
            fontWeight: 600,
            letterSpacing: "0.5px",
            padding: "9px 12px",
            borderRadius: "8px",
            color: "#ffffff",
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          columnHeader: ({ theme }: { theme: Theme }) => ({
            backgroundColor:
              mode === "dark"
                ? alpha(theme.palette.primary.dark, 0.9)
                : alpha(theme.palette.primary.main, 0.12),
            fontWeight: 700,
          }),
          columnHeaderTitle: {
            fontWeight: 700,
          },
        },
      },
    },
    breakpoints: {
      values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    },
  } as const;
};

// Convenience: build a real MUI Theme object
export const createAppTheme = (mode: PaletteMode = "light") =>
  createTheme(themeSettings(mode));
