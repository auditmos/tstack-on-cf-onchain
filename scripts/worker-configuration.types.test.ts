import { expectTypeOf } from "vitest";

describe("Env DB secret types", () => {
	it("types DATABASE_HOST as string (not literal '')", () => {
		expectTypeOf<Env["DATABASE_HOST"]>().toEqualTypeOf<string>();
	});

	it("types DATABASE_USERNAME as string (not literal '')", () => {
		expectTypeOf<Env["DATABASE_USERNAME"]>().toEqualTypeOf<string>();
	});

	it("types DATABASE_PASSWORD as string (not literal '')", () => {
		expectTypeOf<Env["DATABASE_PASSWORD"]>().toEqualTypeOf<string>();
	});
});
