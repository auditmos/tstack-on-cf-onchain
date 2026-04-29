// @vitest-environment jsdom
import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ConnectButton } from "@/components/web3/connect-button";
import { Web3Provider } from "./root-provider";

describe("Web3Provider — integration", () => {
	it("mounts ConnectButton without crashing and shows disconnected label", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		render(
			<Web3Provider queryClient={queryClient}>
				<ConnectButton />
			</Web3Provider>,
		);

		const button = await screen.findByRole("button");
		expect(button).toHaveProperty("textContent", "Connect Wallet");
	});
});
