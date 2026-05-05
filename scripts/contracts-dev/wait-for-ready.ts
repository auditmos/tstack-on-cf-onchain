interface WaitForReadyOptions {
	url: string;
	timeoutMs: number;
	intervalMs: number;
}

export async function waitForReady(opts: WaitForReadyOptions): Promise<void> {
	const deadline = Date.now() + opts.timeoutMs;

	while (Date.now() < deadline) {
		if (await probeChainId(opts.url)) return;
		await sleep(opts.intervalMs);
	}

	throw new Error(`waitForReady: ${opts.url} did not respond within ${opts.timeoutMs}ms`);
}

async function probeChainId(url: string): Promise<boolean> {
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
		});
		if (!res.ok) return false;
		const json = (await res.json()) as { result?: string };
		return typeof json.result === "string" && json.result.startsWith("0x");
	} catch {
		return false;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
