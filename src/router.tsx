import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { lazy, Suspense } from "react";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Web3Provider transitively pulls wagmi/viem/connectkit. Vite tree-shakes the
// dynamic import out of the SSR build because `import.meta.env.SSR` is folded
// to a constant at build time — the unreachable branch is dropped and the
// target chunk is never emitted into dist/server/. See audit M5 / issue #28
// and `.claude/rules/frontend/web3-ssr.md`.
const Web3Provider = import.meta.env.SSR
	? null
	: lazy(() =>
			import("./integrations/web3/root-provider").then((m) => ({
				default: m.Web3Provider,
			})),
		);

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const router = createRouter({
		routeTree,
		context: { ...rqContext },
		defaultPreload: "intent",
		Wrap: (props: { children: React.ReactNode }) => {
			const shell = (
				<QueryClientProvider client={rqContext.queryClient}>{props.children}</QueryClientProvider>
			);
			if (!Web3Provider) return shell;
			return (
				<Suspense fallback={shell}>
					<Web3Provider queryClient={rqContext.queryClient}>{props.children}</Web3Provider>
				</Suspense>
			);
		},
	});

	setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient });

	return router;
};
