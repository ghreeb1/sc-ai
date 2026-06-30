/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        light: {
          background: "#ffffff",
          foreground: "#0f1419",
          card: "#f5f5f5",
          primary: "#3b82f6",
          secondary: "#8b5cf6",
          muted: "#d1d5db",
          accent: "#10b981",
          destructive: "#ef4444",
          border: "#e5e7eb",
        },
        dark: {
          background: "#0f1419",
          foreground: "#f5f5f5",
          card: "#1a1f2e",
          primary: "#60a5fa",
          secondary: "#a78bfa",
          muted: "#4b5563",
          accent: "#10b981",
          destructive: "#f87171",
          border: "#2d3748",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
