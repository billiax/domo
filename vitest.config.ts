import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["extension/src/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    define: {
      __DEV_MODE__: "false",
    },
  },
});
