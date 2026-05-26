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

import { apiHono } from "@/hono/api";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("apiHono validation — error response shape", () => {
	it("POST /api/clients with empty body returns 400 with { error, details }", async () => {
		const res = await apiHono.request("/api/clients", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: unknown };
		expect(body).toHaveProperty("error", "Validation failed");
		expect(body).toHaveProperty("details");
	});

	it("PUT /api/clients/:id with non-uuid param returns 400 same shape", async () => {
		const res = await apiHono.request("/api/clients/not-a-uuid", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: "new@example.com" }),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: unknown };
		expect(body.error).toBe("Validation failed");
		expect(body.details).toBeDefined();
	});

	it("PUT with empty body returns 400 same shape", async () => {
		const res = await apiHono.request("/api/clients/11111111-1111-4111-8111-111111111111", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: unknown };
		expect(body.error).toBe("Validation failed");
		expect(body.details).toBeDefined();
	});

	it("DELETE /api/clients/:id with non-uuid param returns 400 same shape", async () => {
		const res = await apiHono.request("/api/clients/not-a-uuid", {
			method: "DELETE",
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: unknown };
		expect(body.error).toBe("Validation failed");
		expect(body.details).toBeDefined();
	});

	it("GET /api/clients with non-numeric limit returns 400 same shape", async () => {
		const res = await apiHono.request("/api/clients?limit=abc");

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: unknown };
		expect(body.error).toBe("Validation failed");
		expect(body.details).toBeDefined();
	});

	it("GET /api/clients/:id with non-uuid param returns 400 same shape", async () => {
		const res = await apiHono.request("/api/clients/not-a-uuid");

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: unknown };
		expect(body.error).toBe("Validation failed");
		expect(body.details).toBeDefined();
	});

	it("POST surfaces per-field errors via details.fieldErrors", async () => {
		const res = await apiHono.request("/api/clients", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "", surname: "", email: "not-an-email" }),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as {
			error: string;
			details: { fieldErrors: Record<string, string[]> };
		};
		expect(body.details.fieldErrors).toBeTypeOf("object");
		expect(body.details.fieldErrors.name).toEqual(expect.arrayContaining([expect.any(String)]));
		expect(body.details.fieldErrors.surname).toEqual(expect.arrayContaining([expect.any(String)]));
		expect(body.details.fieldErrors.email).toEqual(expect.arrayContaining([expect.any(String)]));
	});
});
