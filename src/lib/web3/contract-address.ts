import { contractAddresses } from "@/contracts/addresses";

type Address = `0x${string}`;

export function getContractAddress(chainId: number, name: string): Address | undefined {
	const registry = contractAddresses as unknown as Record<string, Record<string, Address>>;
	return registry[String(chainId)]?.[name];
}
