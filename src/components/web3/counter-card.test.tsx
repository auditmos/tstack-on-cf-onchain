// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { counterAbi } from "@/contracts/abis/Counter";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";

const useAccountMock = vi.fn();
const useReadContractMock = vi.fn();
const useWriteContractMock = vi.fn();
const useWaitForTransactionReceiptMock = vi.fn();

vi.mock("wagmi", () => ({
	useAccount: () => useAccountMock(),
	useReadContract: (args: unknown) => useReadContractMock(args),
	useWriteContract: () => useWriteContractMock(),
	useWaitForTransactionReceipt: (args: unknown) => useWaitForTransactionReceiptMock(args),
}));

const addressesRef = vi.hoisted(() => ({
	current: {
		"31337": { Counter: "0x5FbDB2315678afecb367f032d93F642f64180aa3" },
	} as Record<string, Record<string, string>>,
}));

vi.mock("@/contracts/addresses", () => ({
	get contractAddresses() {
		return addressesRef.current;
	},
}));

import { CounterCard } from "./counter-card";

function renderReady(node: React.ReactElement) {
	return render(<WalletReadyContext.Provider value={true}>{node}</WalletReadyContext.Provider>);
}

beforeEach(() => {
	useAccountMock.mockReset();
	useReadContractMock.mockReset();
	useWriteContractMock.mockReset();
	useWaitForTransactionReceiptMock.mockReset();
	useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
	useReadContractMock.mockReturnValue({
		data: undefined,
		isLoading: false,
		refetch: vi.fn(),
	});
	useWriteContractMock.mockReturnValue({
		writeContract: vi.fn(),
		data: undefined,
		isPending: false,
		error: undefined,
		reset: vi.fn(),
	});
	useWaitForTransactionReceiptMock.mockReturnValue({
		isLoading: false,
		isSuccess: false,
		isError: false,
		error: undefined,
	});
});

describe("CounterCard — pre-hydration (no WalletReady context)", () => {
	it("renders placeholder without invoking wagmi hooks", async () => {
		render(<CounterCard />);

		expect(screen.getByText(/loading/i)).toBeDefined();
		expect(useReadContractMock).not.toHaveBeenCalled();
		expect(useWriteContractMock).not.toHaveBeenCalled();
		expect(useWaitForTransactionReceiptMock).not.toHaveBeenCalled();
	});
});

describe("CounterCard — read", () => {
	it("renders current counter value from chain", async () => {
		useReadContractMock.mockReturnValue({
			data: 42n,
			isLoading: false,
			refetch: vi.fn(),
		});

		renderReady(<CounterCard />);

		expect(await screen.findByText("42")).toBeDefined();
	});

	it("shows loading indicator while initial read is pending", async () => {
		useReadContractMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			refetch: vi.fn(),
		});

		renderReady(<CounterCard />);

		expect(await screen.findByText(/loading/i)).toBeDefined();
	});
});

describe("CounterCard — increment gating", () => {
	it("disables Increment and shows wallet-connect hint when disconnected", async () => {
		useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
		useReadContractMock.mockReturnValue({ data: 0n, isLoading: false, refetch: vi.fn() });

		renderReady(<CounterCard />);

		const button = await screen.findByRole("button", { name: /increment/i });
		expect(button).toHaveProperty("disabled", true);
		expect(screen.getByText(/connect wallet/i)).toBeDefined();
	});

	it("enables Increment when wallet is connected", async () => {
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useReadContractMock.mockReturnValue({ data: 0n, isLoading: false, refetch: vi.fn() });

		renderReady(<CounterCard />);

		const button = await screen.findByRole("button", { name: /increment/i });
		expect(button).toHaveProperty("disabled", false);
	});

	it("shows 'Confirming…' and disables Increment while tx is in-flight", async () => {
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useWriteContractMock.mockReturnValue({
			writeContract: vi.fn(),
			data: "0xtxhash",
			isPending: false,
			reset: vi.fn(),
		});
		useWaitForTransactionReceiptMock.mockReturnValue({
			isLoading: true,
			isSuccess: false,
		});

		renderReady(<CounterCard />);

		const button = await screen.findByRole("button", { name: /confirming/i });
		expect(button).toHaveProperty("disabled", true);
	});

	it("invokes writeContract with counterAbi + address + 'increment' on click", async () => {
		const writeContract = vi.fn();
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useWriteContractMock.mockReturnValue({
			writeContract,
			data: undefined,
			isPending: false,
			reset: vi.fn(),
		});

		renderReady(<CounterCard />);

		const button = await screen.findByRole("button", { name: /increment/i });
		fireEvent.click(button);

		expect(writeContract).toHaveBeenCalledTimes(1);
		expect(writeContract).toHaveBeenCalledWith({
			abi: counterAbi,
			address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
			functionName: "increment",
			chainId: 31337,
		});
	});
});

describe("CounterCard — refetch after confirmation", () => {
	it("calls refetch when receipt confirms successfully", async () => {
		const refetch = vi.fn();
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useReadContractMock.mockReturnValue({ data: 5n, isLoading: false, refetch });
		useWriteContractMock.mockReturnValue({
			writeContract: vi.fn(),
			data: "0xtxhash",
			isPending: false,
			reset: vi.fn(),
		});
		useWaitForTransactionReceiptMock.mockReturnValue({
			isLoading: false,
			isSuccess: true,
		});

		renderReady(<CounterCard />);

		await screen.findByRole("button", { name: /increment/i });
		expect(refetch).toHaveBeenCalledTimes(1);
	});

	it("does not call refetch on initial render before any tx", async () => {
		const refetch = vi.fn();
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useReadContractMock.mockReturnValue({ data: 5n, isLoading: false, refetch });
		useWriteContractMock.mockReturnValue({
			writeContract: vi.fn(),
			data: undefined,
			isPending: false,
			reset: vi.fn(),
		});
		useWaitForTransactionReceiptMock.mockReturnValue({
			isLoading: false,
			isSuccess: false,
		});

		renderReady(<CounterCard />);

		await screen.findByRole("button", { name: /increment/i });
		expect(refetch).not.toHaveBeenCalled();
	});
});

describe("CounterCard — transaction errors", () => {
	it("renders a destructive alert and re-enables Increment when the wallet rejects the transaction", async () => {
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useWriteContractMock.mockReturnValue({
			writeContract: vi.fn(),
			data: undefined,
			isPending: false,
			error: new Error("User rejected the request."),
			reset: vi.fn(),
		});

		renderReady(<CounterCard />);

		const alert = await screen.findByRole("alert");
		expect(alert.textContent).toMatch(/rejected/i);

		const button = screen.getByRole("button", { name: /increment/i });
		expect(button).toHaveProperty("disabled", false);
	});

	it("renders a destructive alert and re-enables Increment when the transaction reverts on chain", async () => {
		useAccountMock.mockReturnValue({
			address: "0xabcd1234567890abcdef1234567890abcdef0123",
			isConnected: true,
		});
		useWriteContractMock.mockReturnValue({
			writeContract: vi.fn(),
			data: "0xtxhash",
			isPending: false,
			error: undefined,
			reset: vi.fn(),
		});
		useWaitForTransactionReceiptMock.mockReturnValue({
			isLoading: false,
			isSuccess: false,
			isError: true,
			error: new Error("Transaction reverted"),
		});

		renderReady(<CounterCard />);

		const alert = await screen.findByRole("alert");
		expect(alert.textContent).toMatch(/reverted/i);

		const button = screen.getByRole("button", { name: /increment/i });
		expect(button).toHaveProperty("disabled", false);
	});

	it("renders no alert when there is no error", async () => {
		renderReady(<CounterCard />);

		await screen.findByRole("button", { name: /increment/i });
		expect(screen.queryByRole("alert")).toBeNull();
	});
});

describe("CounterCard — no deployment", () => {
	it("shows 'not deployed' placeholder when contract address is missing", async () => {
		const previous = addressesRef.current;
		addressesRef.current = {};

		try {
			renderReady(<CounterCard />);
			expect(await screen.findByText(/not deployed/i)).toBeDefined();
		} finally {
			addressesRef.current = previous;
		}
	});
});
