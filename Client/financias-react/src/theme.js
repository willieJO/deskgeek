import { createTheme } from "@mui/material/styles";

export default createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#a78bfa", contrastText: "#171123" },
    secondary: { main: "#c4b5fd" },
    background: { default: "#101014", paper: "#1c1b23" },
    text: { primary: "#f4f3f7", secondary: "#aaa6b8" },
    divider: "#ffffff14",
    success: { main: "#6ee7b7" },
    error: { main: "#fda4af" },
  },
  typography: {
    fontFamily: '"Manrope", sans-serif',
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: "1px solid #ffffff14",
          boxShadow: "0 30px 100px #0009",
        },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 800 } } },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "16px 24px", gap: 8 } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 42, gap: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: "#141319" },
        notchedOutline: { borderColor: "#ffffff24" },
      },
    },
  },
});
