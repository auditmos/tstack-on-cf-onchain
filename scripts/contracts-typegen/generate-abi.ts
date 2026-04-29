export interface FoundryArtifact {
	abi: unknown[];
	metadata?: {
		settings?: {
			compilationTarget?: Record<string, string>;
		};
	};
}

export function generateAbiModule(artifact: FoundryArtifact, contractName: string): string {
	const exportName = `${contractName.charAt(0).toLowerCase()}${contractName.slice(1)}Abi`;
	const abiJson = JSON.stringify(artifact.abi, null, 2);
	return `export const ${exportName} = ${abiJson} as const;\n`;
}
