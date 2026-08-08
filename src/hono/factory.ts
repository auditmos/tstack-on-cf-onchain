import { Hono } from "hono";

export const createHono = <Variables extends object = object>() =>
	new Hono<{ Bindings: Env; Variables: Variables }>();
