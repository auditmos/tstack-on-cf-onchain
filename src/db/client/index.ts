export { createClient, deleteClient, getClient, getClients, updateClient } from "./queries";

export type { Client, ClientCreateInput, ClientUpdateInput } from "./schema";

export {
	ClientCreateRequestSchema,
	ClientUpdateRequestSchema,
	IdParamSchema,
	PaginationRequestSchema,
} from "./schema";
