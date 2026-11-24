import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Repo GitHub Pages: https://asaayuti.github.io/cbt-ujian-online/
const repo = "cbt-ujian-online";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? `/${repo}/`,
});
