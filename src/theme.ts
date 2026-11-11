"use client";
import { createTheme } from "@mui/material/styles";

/**
 * 色の約束
 * - 青（primary）：正解・「守られる」・選択中
 * - オレンジ（warning）：不正解・「守られない」
 *   赤と緑ではなく青とオレンジにして、色の見分けにくい人にも区別しやすくする
 */
export const COLORS = {
  ink: "#1C2433",
  muted: "#5B6475",
  line: "#E3E6EC",
  border: "#C9CED8",
  bg: "#F7F8FA",
  blue: "#1D4ED8",
  blueSoft: "#EEF3FF",
  orange: "#9A3412",
  orangeSoft: "#FFF8F2",
  orangeLine: "#F1D3BF",
};

const theme = createTheme({
  palette: {
    primary: { main: COLORS.blue },
    warning: { main: COLORS.orange },
    text: { primary: COLORS.ink, secondary: COLORS.muted },
    background: { default: COLORS.bg },
    divider: COLORS.line,
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif',
    button: { textTransform: "none", fontWeight: 700 },
  },
  // sx の borderRadius: 3 が 12px になるよう、基準を 4px にする
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 48, borderRadius: 999, paddingLeft: 24, paddingRight: 24 },
        sizeLarge: { minHeight: 56, fontSize: "1.05rem", paddingLeft: 32, paddingRight: 32 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${COLORS.line}` } },
    },
  },
});

export default theme;
