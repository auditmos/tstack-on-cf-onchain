// `vite` is exact-pinned (not `^7.1.2`) in package.json: `@vitejs/plugin-react`'s
// current major (^4.7.0) tops out at vite 7, so lifting this pin to vite 8 needs
// a coordinated `@vitejs/plugin-react` major bump too. See "Dependency Policy"
// in README.md for the full peer-compatibility matrix and the decision record.
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart({
			srcDirectory: "src",
			start: { entry: "./start.tsx" },
			server: { entry: "./server.ts" },
		}),
		viteReact(),
		cloudflare({
			viteEnvironment: {
				name: "ssr",
			},
		}),
	],
});

export default config;
