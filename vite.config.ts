// This is a dev dependency for building, so importing dev deps is fine
/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dns from "dns";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  if (command === "serve") {
    // Open on localhost instead of 127.0.0.1 for Node < 17
    // https://github.com/vitejs/vite/issues/9195
    dns.setDefaultResultOrder("verbatim");
  }
  const env = loadEnv(mode, process.cwd(), "");

  // https://github.com/vitejs/vite/issues/3105#issuecomment-939703781
  const htmlPlugin = () => ({
    name: "html-transform",
    transformIndexHtml: {
      enforce: "pre" as const,
      transform(html: string) {
        return html.replace(/#(.*?)#/g, (_, p1) => env[p1]);
      },
    },
  });

  let port = Number.parseInt(env.PORT, 10);
  if (Number.isNaN(port) || port <= 0) {
    port = 3000;
  }

  // const useDhcPackages = env.USE_DHC_PACKAGES === "true";
  const packagesDir = env.DHC_PACKAGES_PATH;
  // const aclApiProxyTarget = env.ACL_EDITOR_REST_API_PROXY_URL;

  return {
    // Vite does not read this env variable, it sets it based on the config
    // For easy changes using our .env files, read it here and vite will just set it to the existing value
    base: env.BASE_URL,
    cacheDir: "node_modules/.cache/.vite",
    envPrefix: [
      "VITE_",
      "REACT_APP_", // Keep env files similar for pre-silverheels CRA releases
      "npm_", // Needed to use $npm_package_version
    ],
    server: {
      port,
      open: true,
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          // useDhcPackages ? searchForWorkspaceRoot(packagesDir) : undefined,
        ].filter(Boolean) as string[],
      },
      // proxy: aclApiProxyTarget
      //   ? {
      //       "/acl": {
      //         target: aclApiProxyTarget,
      //         changeOrigin: true,
      //       },
      //     }
      //   : undefined,
    },
    preview: {
      port,
      open: true,
    },
    resolve: {
      dedupe: ["react", "react-redux", "redux", "monaco-editor"],
      // alias: useDhcPackages
      //   ? [
      //       {
      //         find: /^@deephaven\/(.*)\/scss\/(.*)/,
      //         replacement: `${packagesDir}/$1/scss/$2`,
      //       },
      //       {
      //         find: /^@deephaven\/icons$/,
      //         replacement: `${packagesDir}/icons/dist/index.es.js`,
      //       },
      //       {
      //         find: /^@deephaven\/(.*)/,
      //         replacement: `${packagesDir}/$1/src`,
      //       },
      //     ]
      //   : [],
    },
    build: {
      outDir: path.resolve(__dirname, env.BUILD_PATH),
      assetsDir: "static", // We serve out of /iriside/static in production
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            /**
             * Without this, our chunk order may cause a circular reference
             * by putting the helpers in the vendor or plotly chunk
             * This causes failures with loading the compiled version
             *
             * See https://github.com/rollup/plugins/issues/591
             */
            if (id === "\0commonjsHelpers.js") {
              return "helpers";
            }

            // Removing these chunks causes Vite to take up a lot more RAM
            // https://github.com/vitejs/vite/issues/2433
            if (id.includes("node_modules")) {
              if (id.includes("monaco-editor")) {
                return "monaco";
              }
              return "vendor";
            }

            return undefined;
          },
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Some packages need this to start properly if they reference global
        define: {
          global: "globalThis",
        },
      },
    },
    css: {
      devSourcemap: true,
    },
    plugins: [htmlPlugin(), react()],
  };
});
