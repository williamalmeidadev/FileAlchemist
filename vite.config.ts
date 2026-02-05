import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/FileAlchemist/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
