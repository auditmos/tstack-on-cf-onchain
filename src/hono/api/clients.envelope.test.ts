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

import type { Client } from "@/db/client";
import { createClient, deleteClient, getClient, getClients, updateClient } from "@/db/client";
import { apiHono } from "@/hono/api";

const sampleClient: Client = {
	id: "11111111-1111-4111-8111-111111111111",
	name: "Ada",
	surname: "Lovelace",
	email: "ada@example.com",
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("apiHono response envelopes — { data } / { data, meta }", () => {
	it("GET /api/clients returns { data: Client[], meta: PaginationMeta }", async () => {
		vi.mocked(getClients).mockResolvedValueOnce({
			items: [sampleClient],
			meta: { total: 1, limit: 10, offset: 0, hasMore: false },
		});

		const res = await apiHono.request("/api/clients");

		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			data: Client[];
			meta: { total: number; limit: number; offset: number; hasMore: boolean };
		};
		expect(body).toHaveProperty("data");
		expect(body).toHaveProperty("meta");
		expect(body).not.toHaveProperty("pagination");
		expect(body.data).toEqual([sampleClient]);
		expect(body.meta).toEqual({ total: 1, limit: 10, offset: 0, hasMore: false });
	});

	it("GET /api/clients/:id returns { data: Client }", async () => {
		vi.mocked(getClient).mockResolvedValueOnce(sampleClient);

		const res = await apiHono.request(`/api/clients/${sampleClient.id}`);

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: Client };
		expect(body).toEqual({ data: sampleClient });
	});

	it("POST /api/clients returns { data: Client } with status 201", async () => {
		vi.mocked(createClient).mockResolvedValueOnce(sampleClient);

		const res = await apiHono.request("/api/clients", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "Ada", surname: "Lovelace", email: "ada@example.com" }),
		});

		expect(res.status).toBe(201);
		const body = (await res.json()) as { data: Client };
		expect(body).toEqual({ data: sampleClient });
	});

	it("PUT /api/clients/:id returns { data: Client }", async () => {
		vi.mocked(updateClient).mockResolvedValueOnce(sampleClient);

		const res = await apiHono.request(`/api/clients/${sampleClient.id}`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: "updated@example.com" }),
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: Client };
		expect(body).toEqual({ data: sampleClient });
	});

	it("DELETE /api/clients/:id returns { data: { id } }", async () => {
		vi.mocked(deleteClient).mockResolvedValueOnce(true);

		const res = await apiHono.request(`/api/clients/${sampleClient.id}`, {
			method: "DELETE",
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { id: string } };
		expect(body).toEqual({ data: { id: sampleClient.id } });
		expect(body).not.toHaveProperty("success");
	});
});
