// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        duck: {
          50: "#fffbe6",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
    },
  },
  plugins: [],
};
