// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
//
// Nitro deploy bundling is opt-in outside Lovable Cloud — required for Vercel.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercelBuild =
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true" ||
  Boolean(process.env.VERCEL_ENV);

export default defineConfig({
  nitro: isVercelBuild
    ? {
        preset: "vercel",
        // @lovable.dev/vite-tanstack-config defaults to dist/server, which breaks
        // Vercel's Build Output API (needs functions/__server.func + static/).
        output: {
          dir: ".vercel/output",
          serverDir: ".vercel/output/functions/__server.func",
          publicDir: ".vercel/output/static",
        },
      }
    : {
        preset: "cloudflare-module",
      },
});
