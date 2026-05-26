import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AppError } from "@/core/errors";
import { exampleMiddlewareWithContext } from "@/core/middleware/example-middleware";

// import { env } from "cloudflare:workers";

const baseFunction = createServerFn().middleware([exampleMiddlewareWithContext]);

const ExampleInputSchema = z.object({
	exampleKey: z.string().min(1),
});

type ExampleInput = z.infer<typeof ExampleInputSchema>;

export function validateExampleInput(data: unknown): ExampleInput {
	const parsed = ExampleInputSchema.safeParse(data);
	if (!parsed.success) {
		throw new AppError("Invalid input", "VALIDATION", 400);
	}
	return parsed.data;
}

export const examplefunction = baseFunction
	.inputValidator(validateExampleInput)
	.handler(async (ctx) => {
		// biome-ignore lint/suspicious/noConsole: demo logs for server function execution flow
		console.log(
			JSON.stringify({
				msg: "example function invoked",
				data: ctx.data,
				ctx: ctx.context,
			}),
		);
		return "Function executed successfully";
	});
