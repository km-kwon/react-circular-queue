import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./__test__/setup.ts",
    include: ["__test__/**/*.test.{ts,tsx}"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      all: false,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "__test__/",
        "dist/",
        "examples/",
        "coverage/",
        "**/*.config.ts",
        "src/types/**",
        "src/index.ts",
        "src/hooks/index.ts",
      ],
    },
  },
});
