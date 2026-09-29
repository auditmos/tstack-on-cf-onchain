export { createClient, deleteClient, getClient, getClients, updateClient } from "./queries";
export type {
	Client,
	ClientCreateInput,
	/** @public — input type for `updateClient`, kept for API symmetry with `ClientCreateInput` */
	ClientUpdateInput,
} from "./schema";

export {
	ClientCreateRequestSchema,
	ClientUpdateRequestSchema,
	IdParamSchema,
	PaginationRequestSchema,
} from "./schema";
