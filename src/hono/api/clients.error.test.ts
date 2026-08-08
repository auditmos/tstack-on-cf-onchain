import { beforeEach, vi } from "vitest";

vi.mock("@/db/client", async () => {
	const actual = await vi.importActual<typeof import("@/db/client")>("@/db/client");
	return {
		...actual,
		createClient: vi.fn(),
		updateClient: vi.fn(),
		deleteClient: vi.fn(),
		getClient: vi.fn(),
		getClients: vi.fn(),
	};
});

import { createClient, deleteClient, getClient, getClients, updateClient } from "@/db/client";
import { apiHono } from "@/hono/api";
import { PERMISSIVE_TEST_ENV } from "@/hono/test-env";

function drizzleUniqueViolation(): Error {
	const cause = Object.assign(new Error("duplicate key value violates unique constraint"), {
		code: "23505",
	});
	const err = new Error(
		'Failed query: insert into "clients" ("id", "name", "surname", "email") values ($1, $2, $3, $4)\nparams: 00000000-0000-0000-0000-000000000000,Ada,Lovelace,ada@example.com',
	);
	(err as Error & { cause: unknown }).cause = cause;
	return err;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("apiHono error middleware — unique violations", () => {
	it("maps PUT unique-violation to 409 with sanitized body", async () => {
		vi.mocked(updateClient).mockRejectedValueOnce(drizzleUniqueViolation());

		const res = await apiHono.request(
			"/api/clients/11111111-1111-4111-8111-111111111111",
			{
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "duplicate@example.com" }),
			},
			PERMISSIVE_TEST_ENV,
		);

		expect(res.status).toBe(409);
		const text = await res.text();
		expect(text).not.toContain("Failed query");
		expect(text).not.toContain("insert into");
		const body = JSON.parse(text) as { error: string };
		expect(body.error.toLowerCase()).toContain("exists");
	});

	it("sanitizes unexpected DB errors to 500 without leaking SQL", async () => {
		const sqlLeak = 'Failed query: select "id", "name", "surname", "email" from "clients" limit $1';
		const cause = Object.assign(new Error("connection reset"), { code: "ECONNRESET" });
		const err = new Error(sqlLeak);
		(err as Error & { cause: unknown }).cause = cause;
		vi.mocked(getClients).mockRejectedValueOnce(err);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await apiHono.request("/api/clients", {}, PERMISSIVE_TEST_ENV);

		expect(res.status).toBe(500);
		const text = await res.text();
		expect(text).not.toContain("Failed query");
		expect(text).not.toContain("select");
		expect(text).not.toContain("clients");
		const body = JSON.parse(text) as { error: string };
		expect(body).toEqual({ error: "Internal error" });
		expect(consoleSpy).toHaveBeenCalledTimes(1);
		const logged = String(consoleSpy.mock.calls[0]?.[0]);
		expect(() => JSON.parse(logged)).not.toThrow();

		consoleSpy.mockRestore();
	});

	it("returns 404 when GET /:id finds no client", async () => {
		vi.mocked(getClient).mockResolvedValueOnce(null);

		const res = await apiHono.request(
			"/api/clients/22222222-2222-4222-8222-222222222222",
			{},
			PERMISSIVE_TEST_ENV,
		);

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ error: "Client not found" });
	});

	it("returns 404 when PUT /:id finds no client", async () => {
		vi.mocked(updateClient).mockResolvedValueOnce(null);

		const res = await apiHono.request(
			"/api/clients/22222222-2222-4222-8222-222222222222",
			{
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "new@example.com" }),
			},
			PERMISSIVE_TEST_ENV,
		);

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ error: "Client not found" });
	});

	it("returns 404 when DELETE /:id finds no client", async () => {
		vi.mocked(deleteClient).mockResolvedValueOnce(false);

		const res = await apiHono.request(
			"/api/clients/22222222-2222-4222-8222-222222222222",
			{
				method: "DELETE",
			},
			PERMISSIVE_TEST_ENV,
		);

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ error: "Client not found" });
	});

	it("maps POST unique-violation to 409 with sanitized body", async () => {
		vi.mocked(createClient).mockRejectedValueOnce(drizzleUniqueViolation());

		const res = await apiHono.request(
			"/api/clients",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name: "Ada", surname: "Lovelace", email: "ada@example.com" }),
			},
			PERMISSIVE_TEST_ENV,
		);

		expect(res.status).toBe(409);
		const text = await res.text();
		expect(text).not.toContain("Failed query");
		const body = JSON.parse(text) as { error: string };
		expect(body.error.toLowerCase()).toContain("exists");
	});
});
