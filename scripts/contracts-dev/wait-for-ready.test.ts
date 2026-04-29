import { createServer, type Server } from "node:http";
import { afterEach, beforeEach } from "vitest";
import { waitForReady } from "./wait-for-ready";

interface StartedServer {
	server: Server;
	url: string;
}

async function startJsonRpcServer(handler: (body: unknown) => unknown): Promise<StartedServer> {
	const server = createServer((req, res) => {
		let raw = "";
		req.on("data", (chunk) => {
			raw += chunk.toString();
		});
		req.on("end", () => {
			const body = raw ? JSON.parse(raw) : null;
			const result = handler(body);
			if (result === undefined) {
				res.statusCode = 500;
				res.end();
				return;
			}
			res.setHeader("content-type", "application/json");
			res.end(JSON.stringify(result));
		});
	});

	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (!address || typeof address === "string") {
		throw new Error("Server did not bind to a port");
	}
	return { server, url: `http://127.0.0.1:${address.port}` };
}

async function stopServer(server: Server): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		server.close((err) => (err ? reject(err) : resolve()));
	});
}

describe("waitForReady", () => {
	let started: StartedServer | null = null;

	beforeEach(() => {
		started = null;
	});

	afterEach(async () => {
		if (started) await stopServer(started.server);
	});

	it("resolves when the JSON-RPC server returns a chainId", async () => {
		started = await startJsonRpcServer((body) => {
			const req = body as { id?: number; method?: string };
			if (req.method !== "eth_chainId") return undefined;
			return { jsonrpc: "2.0", id: req.id ?? 1, result: "0x7a69" };
		});

		await expect(
			waitForReady({ url: started.url, timeoutMs: 2000, intervalMs: 50 }),
		).resolves.toBeUndefined();
	});

	it("rejects after timeout when no server answers", async () => {
		// Reserve a port then close the server so the address is free → connection refused.
		const probe = createServer();
		await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
		const address = probe.address();
		if (!address || typeof address === "string") throw new Error("no port");
		const port = address.port;
		await new Promise<void>((resolve) => probe.close(() => resolve()));

		await expect(
			waitForReady({
				url: `http://127.0.0.1:${port}`,
				timeoutMs: 200,
				intervalMs: 30,
			}),
		).rejects.toThrow(/did not respond/);
	});
});
