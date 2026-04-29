import type { FoundryArtifact } from "./generate-abi";

export function isUserArtifact(artifact: Pick<FoundryArtifact, "metadata">): boolean {
	const target = artifact.metadata?.settings?.compilationTarget;
	if (!target) return false;
	const sourcePath = Object.keys(target)[0];
	if (!sourcePath) return false;
	return sourcePath.startsWith("src/");
}
