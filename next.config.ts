import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is a fully client-driven planning tool (localStorage state,
  // no server-rendered content that benefits from static prerendering or
  // partial caching), so Cache Components' build-time prerender pass only
  // adds friction (e.g. flagging `new Date()` defaults as "unstable").
  // Disabling it keeps every route server-rendered per request, which is
  // the right model for this app.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
