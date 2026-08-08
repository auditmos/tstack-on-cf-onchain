import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

type McpConfig = {
	mcpServers?: Record<string, { url?: string; type?: string }>;
};

function readMcpConfig(): McpConfig {
	const raw = readFileSync(resolve(ROOT, ".mcp.json"), "utf8");
	return JSON.parse(raw) as McpConfig;
}

describe("Cloudflare docs MCP server declaration (issue #53)", () => {
	it(".mcp.json is valid JSON", () => {
		expect(() => readMcpConfig()).not.toThrow();
	});

	it("declares the Cloudflare documentation server", () => {
		const config = readMcpConfig();
		expect(config.mcpServers?.["cloudflare-docs"]?.url).toBe("https://docs.mcp.cloudflare.com/mcp");
	});
});
