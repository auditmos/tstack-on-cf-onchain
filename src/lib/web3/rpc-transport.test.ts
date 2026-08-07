import { createServer, type Server } from "node:http";
import { createClient } from "viem";
import { createRpcTransport, resolveRpcUrls } from "./rpc-transport";

const chain = {
	id: 1,
	rpcUrls: { default: { http: ["https://public.example/rpc"] } },
};

describe("resolveRpcUrls", () => {
	it("uses the configured endpoint in preference to the public default", () => {
		const urls = resolveRpcUrls(chain, { VITE_RPC_URL_1: "https://configured.example/rpc" });
		expect(urls[0]).toBe("https://configured.example/rpc");
	});

	it("orders the configured endpoint first and the public endpoint last, deterministically", () => {
		const urls = resolveRpcUrls(chain, { VITE_RPC_URL_1: "https://configured.example/rpc" });
		expect(urls).toEqual(["https://configured.example/rpc", "https://public.example/rpc"]);
	});

	it("degrades to the public endpoint alone for an unconfigured chain, rather than failing", () => {
		const urls = resolveRpcUrls(chain, {});
		expect(urls).toEqual(["https://public.example/rpc"]);
	});

	it("ignores env keys for other chain ids", () => {
		const urls = resolveRpcUrls(chain, { VITE_RPC_URL_999: "https://wrong-chain.example/rpc" });
		expect(urls).toEqual(["https://public.example/rpc"]);
	});
});

describe("createRpcTransport — real failover, no mocking", () => {
	let workingServer: Server;
	let workingUrl: string;
	let unreachableUrl: string;

	beforeAll(async () => {
		workingServer = createServer((req, res) => {
			let raw = "";
			req.on("data", (chunk) => {
				raw += chunk.toString();
			});
			req.on("end", () => {
				const body = JSON.parse(raw) as { id?: number };
				res.setHeader("content-type", "application/json");
				res.end(JSON.stringify({ jsonrpc: "2.0", id: body.id ?? 1, result: "0x539" }));
			});
		});
		await new Promise<void>((resolve) => workingServer.listen(0, "127.0.0.1", resolve));
		const address = workingServer.address();
		if (!address || typeof address === "string") throw new Error("server did not bind");
		workingUrl = `http://127.0.0.1:${address.port}`;

		// Reserve a port then close it — guaranteed connection refused, not a mock.
		const probe = createServer();
		await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
		const probeAddress = probe.address();
		if (!probeAddress || typeof probeAddress === "string") throw new Error("probe did not bind");
		unreachableUrl = `http://127.0.0.1:${probeAddress.port}`;
		await new Promise<void>((resolve) => probe.close(() => resolve()));
	});

	afterAll(async () => {
		await new Promise<void>((resolve, reject) =>
			workingServer.close((err) => (err ? reject(err) : resolve())),
		);
	});

	it("succeeds through the fallback when the configured primary endpoint is genuinely unreachable", async () => {
		const testChain = { id: 1337, rpcUrls: { default: { http: [workingUrl] } } };
		const transport = createRpcTransport(testChain, { VITE_RPC_URL_1337: unreachableUrl });

		const client = createClient({ transport });
		const result = await client.request({ method: "eth_chainId" });

		expect(result).toBe("0x539");
	});
});
