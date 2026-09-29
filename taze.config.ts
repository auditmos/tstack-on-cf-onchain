import { defineConfig } from "taze";

export default defineConfig({
	mode: "minor",
	// Default is 5s; drizzle-orm's full packument is ~64MB and intermittently takes longer
	requestTimeout: 30_000,
	// Soldeer-vendored deps (gitignored); taze 21 would scan their workflow files
	ignorePaths: ["**/node_modules/**", "contracts/dependencies/**"],
});
