import { AppError } from "@/core/errors";
import { validateExampleInput } from "./example-functions";

describe("validateExampleInput", () => {
	it("throws AppError(VALIDATION, 400) when exampleKey is empty string", () => {
		try {
			validateExampleInput({ exampleKey: "" });
			throw new Error("expected validateExampleInput to throw");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect(err).toMatchObject({
				name: "AppError",
				code: "VALIDATION",
				status: 400,
			});
		}
	});

	it("throws AppError(VALIDATION, 400) when exampleKey is missing", () => {
		try {
			validateExampleInput({});
			throw new Error("expected validateExampleInput to throw");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect(err).toMatchObject({ code: "VALIDATION", status: 400 });
		}
	});

	it("throws AppError(VALIDATION, 400) when input is not an object", () => {
		try {
			validateExampleInput("not-an-object");
			throw new Error("expected validateExampleInput to throw");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect(err).toMatchObject({ code: "VALIDATION", status: 400 });
		}
	});

	it("returns parsed data on valid input", () => {
		const result = validateExampleInput({ exampleKey: "hello" });
		expect(result).toEqual({ exampleKey: "hello" });
	});
});
