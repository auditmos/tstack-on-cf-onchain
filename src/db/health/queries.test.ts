import { beforeEach, vi } from "vitest";

vi.mock("@/db/setup", () => ({
	getDb: vi.fn(),
}));

import { getDb } from "@/db/setup";
import { checkDatabase } from "./queries";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("checkDatabase", () => {
	it("logs the DB failure reason when returning disconnected", async () => {
		vi.mocked(getDb).mockImplementation(() => {
			throw new Error("ECONNREFUSED");
		});
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(checkDatabase()).resolves.toBe("disconnected");

		expect(spy).toHaveBeenCalledTimes(1);
		const firstCall = spy.mock.calls[0];
		if (!firstCall) throw new Error("expected console.error to be called");
		const logged = JSON.parse(firstCall[0] as string);
		expect(logged).toMatchObject({
			msg: expect.any(String),
			error: expect.stringContaining("ECONNREFUSED"),
		});
	});

	it("returns connected and does not log when the query succeeds", async () => {
		vi.mocked(getDb).mockReturnValue({
			execute: vi.fn().mockResolvedValue(undefined),
		} as unknown as ReturnType<typeof getDb>);
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(checkDatabase()).resolves.toBe("connected");
		expect(spy).not.toHaveBeenCalled();
	});
});
