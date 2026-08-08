import { z } from "zod";

export const DatabaseStatusSchema = z.enum(["connected", "disconnected"]);
export type DatabaseStatus = z.infer<typeof DatabaseStatusSchema>;
