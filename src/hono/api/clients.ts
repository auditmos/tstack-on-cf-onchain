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

const validationError = (message: string) => new AppError(message, "VALIDATION", 400);

const clientsEndpoint = createHono();

clientsEndpoint.get("/", async (c) => {
	const parsed = PaginationRequestSchema.safeParse({
		limit: c.req.query("limit"),
		offset: c.req.query("offset"),
	});
	if (!parsed.success) {
		throw validationError(parsed.error.message);
	}
	const result = await getClients(parsed.data);
	return c.json(result);
});

clientsEndpoint.get("/:id", async (c) => {
	const parsed = IdParamSchema.safeParse({ id: c.req.param("id") });
	if (!parsed.success) {
		throw validationError(parsed.error.message);
	}
	const client = await getClient(parsed.data.id);
	if (!client) {
		throw clientNotFound();
	}
	return c.json(client);
});

clientsEndpoint.post("/", async (c) => {
	const body = await c.req.json();
	const parsed = ClientCreateRequestSchema.safeParse(body);
	if (!parsed.success) {
		throw validationError(parsed.error.message);
	}
	const client = await createClient(parsed.data);
	return c.json(client, 201);
});

clientsEndpoint.put("/:id", async (c) => {
	const idParsed = IdParamSchema.safeParse({ id: c.req.param("id") });
	if (!idParsed.success) {
		throw validationError(idParsed.error.message);
	}
	const body = await c.req.json();
	const parsed = ClientUpdateRequestSchema.safeParse(body);
	if (!parsed.success) {
		throw validationError(parsed.error.message);
	}
	const client = await updateClient(idParsed.data.id, parsed.data);
	if (!client) {
		throw clientNotFound();
	}
	return c.json(client);
});

clientsEndpoint.delete("/:id", async (c) => {
	const parsed = IdParamSchema.safeParse({ id: c.req.param("id") });
	if (!parsed.success) {
		throw validationError(parsed.error.message);
	}
	const deleted = await deleteClient(parsed.data.id);
	if (!deleted) {
		throw clientNotFound();
	}
	return c.json({ success: true });
});

export default clientsEndpoint;
