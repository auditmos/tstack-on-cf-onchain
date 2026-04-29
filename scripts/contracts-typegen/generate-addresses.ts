export type DeploymentRegistry = Record<string, Record<string, string>>;

export function generateAddressesModule(registry: DeploymentRegistry): string {
	const json = JSON.stringify(registry, null, 2);
	return `export const contractAddresses = ${json} as const;\n`;
}
