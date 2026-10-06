import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1d4ed8" },
    secondary: { main: "#0f766e" },
    background: { default: "#f6f7f9", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#5b6474" },
    divider: "#e5e7eb",
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 650, fontSize: "1.6rem", letterSpacing: "-0.01em" },
    h6: { fontWeight: 600, fontSize: "1.05rem" },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: "1px solid #e5e7eb" } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: "#5b6474", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" },
      },
    },
  },
});
