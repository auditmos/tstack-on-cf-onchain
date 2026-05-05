export interface AnvilProcess {
	kill: (signal?: NodeJS.Signals) => void;
}

interface Logger {
	info: (msg: string) => void;
	error: (msg: string) => void;
}

export interface OrchestrateDeps {
	spawnAnvil: () => AnvilProcess;
	waitForReady: () => Promise<void>;
	deploy: () => Promise<void>;
	typegen: () => Promise<void>;
	logger: Logger;
}

export async function orchestrate(deps: OrchestrateDeps): Promise<AnvilProcess> {
	const anvil = deps.spawnAnvil();
	try {
		await deps.waitForReady();
		await deps.deploy();
		await deps.typegen();
		return anvil;
	} catch (error) {
		anvil.kill();
		throw error;
	}
}
