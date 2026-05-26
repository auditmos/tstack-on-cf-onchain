import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { AppError } from "@/core/errors";
import {
	ClientCreateRequestSchema,
	ClientUpdateRequestSchema,
	createClient,
	deleteClient,
	getClient,
	getClients,
	IdParamSchema,
	PaginationRequestSchema,
	updateClient,
} from "@/db/client";
import { createHono } from "@/hono/factory";

const clientNotFound = () => new AppError("Client not found", "NOT_FOUND", 404);

const clientsEndpoint = createHono();

clientsEndpoint.get(
	"/",
	zValidator("query", PaginationRequestSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Validation failed", details: z.flattenError(result.error) }, 400);
		}
	}),
	async (c) => {
		const params = c.req.valid("query");
		const { items, meta } = await getClients(params);
		return c.json({ data: items, meta });
	},
);

clientsEndpoint.get(
	"/:id",
	zValidator("param", IdParamSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Validation failed", details: z.flattenError(result.error) }, 400);
		}
	}),
	async (c) => {
		const { id } = c.req.valid("param");
		const client = await getClient(id);
		if (!client) {
			throw clientNotFound();
		}
		return c.json({ data: client });
	},
);

clientsEndpoint.post(
	"/",
	zValidator("json", ClientCreateRequestSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Validation failed", details: z.flattenError(result.error) }, 400);
		}
	}),
	async (c) => {
		const data = c.req.valid("json");
		const client = await createClient(data);
		return c.json({ data: client }, 201);
	},
);

clientsEndpoint.put(
	"/:id",
	zValidator("param", IdParamSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Validation failed", details: z.flattenError(result.error) }, 400);
		}
	}),
	zValidator("json", ClientUpdateRequestSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Validation failed", details: z.flattenError(result.error) }, 400);
		}
	}),
	async (c) => {
		const { id } = c.req.valid("param");
		const data = c.req.valid("json");
		const client = await updateClient(id, data);
		if (!client) {
			throw clientNotFound();
		}
		return c.json({ data: client });
	},
);

clientsEndpoint.delete(
	"/:id",
	zValidator("param", IdParamSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Validation failed", details: z.flattenError(result.error) }, 400);
		}
	}),
	async (c) => {
		const { id } = c.req.valid("param");
		const deleted = await deleteClient(id);
		if (!deleted) {
			throw clientNotFound();
		}
		return c.json({ data: { id } });
	},
);

export default clientsEndpoint;
