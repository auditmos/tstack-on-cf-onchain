// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";
import { ConnectButton } from "./connect-button";

const useAccountMock = vi.fn();
const useModalMock = vi.fn();

vi.mock("wagmi", () => ({
	useAccount: () => useAccountMock(),
}));

vi.mock("connectkit", () => ({
	useModal: () => useModalMock(),
}));

beforeEach(() => {
	useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
	useModalMock.mockReturnValue({ setOpen: vi.fn(), open: false });
});

function renderReady(node: React.ReactElement) {
	return render(<WalletReadyContext.Provider value={true}>{node}</WalletReadyContext.Provider>);
}

describe("ConnectButton — pre-hydration (no WalletReady context)", () => {
	it("renders disabled placeholder", () => {
		render(<ConnectButton />);
		const button = screen.getByRole("button");
		expect(button).toHaveProperty("textContent", "Connect Wallet");
		expect(button).toHaveProperty("disabled", true);
	});
});

describe("ConnectButton — disconnected", () => {
	it("renders 'Connect Wallet' label (live, not disabled)", async () => {
		renderReady(<ConnectButton />);
		// Wait for lazy live button to replace the disabled placeholder
		await vi.waitFor(() => {
			const button = screen.getByRole("button", { name: "Connect Wallet" });
			expect(button).toHaveProperty("disabled", false);
		});
	});

	it("opens ConnectKit modal on click", async () => {
		const setOpen = vi.fn();
		useModalMock.mockReturnValue({ setOpen, open: false });
		renderReady(<ConnectButton />);
		const button = await screen.findByRole("button");
		// Wait for lazy ConnectButtonLive to resolve (button becomes enabled)
		await screen.findByRole("button", { name: "Connect Wallet" });
		fireEvent.click(button);
		expect(setOpen).toHaveBeenCalledWith(true);
	});
});

describe("ConnectButton — connected", () => {
	it("renders truncated address (0xabcd…ef01)", async () => {
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		renderReady(<ConnectButton />);
		const button = await screen.findByRole("button");
		// Wait for lazy live component (placeholder shows "Connect Wallet" first)
		const text = await screen.findByText(/0xabcd/);
		expect(button.textContent ?? "").toContain("0xabcd");
		expect(text).toBeDefined();
	});

	it("opens ConnectKit modal on click when connected (account/network view)", async () => {
		const setOpen = vi.fn();
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useModalMock.mockReturnValue({ setOpen, open: false });
		renderReady(<ConnectButton />);
		await screen.findByText(/0xabcd/);
		fireEvent.click(screen.getByRole("button"));
		expect(setOpen).toHaveBeenCalledWith(true);
	});
});
