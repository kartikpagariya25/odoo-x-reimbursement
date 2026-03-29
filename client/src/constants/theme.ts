// src/constants/theme.ts

export type ThemeMode = "light" | "dark";

export const colors = {
  light: {
    background: "#FFFFFF",
    surface: "#F8F9FA",
    primary: "#7C3AED", // Obsidian-like purple
    secondary: "#E5E7EB",

    text: {
      primary: "#111827",
      secondary: "#6B7280",
      muted: "#9CA3AF",
    },

    border: "#E5E7EB",

    success: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
  },

  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    primary: "#A78BFA",

    secondary: "#334155",

    text: {
      primary: "#F9FAFB",
      secondary: "#CBD5F5",
      muted: "#94A3B8",
    },

    border: "#334155",

    success: "#34D399",
    danger: "#F87171",
    warning: "#FBBF24",
  },
};
