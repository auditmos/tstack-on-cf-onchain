// DO NOT DELETE THIS FILE!!!
// Custom CF Workers entry: routes /api/* to Hono, rest to TanStack Start
import handler from "@tanstack/react-start/server-entry";
import { admitRequest } from "@/core/request-admission";
import { apiHono } from "@/hono/api";

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const admission = admitRequest(request, env);
		if (!admission.admitted) return admission.response;

		const url = new URL(request.url);

		if (url.pathname.startsWith("/api/")) {
			return apiHono.fetch(request, env, ctx);
		}

		return handler.fetch(request, {
			context: { fromFetch: true },
		});
	},
};
