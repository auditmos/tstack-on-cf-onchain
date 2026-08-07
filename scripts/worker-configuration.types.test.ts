import { expectTypeOf } from "vitest";

describe("Env DB secret types", () => {
	it("types DATABASE_HOST as possibly-absent (string | undefined)", () => {
		expectTypeOf<Env["DATABASE_HOST"]>().toEqualTypeOf<string | undefined>();
	});

	it("types DATABASE_USERNAME as possibly-absent (string | undefined)", () => {
		expectTypeOf<Env["DATABASE_USERNAME"]>().toEqualTypeOf<string | undefined>();
	});

	it("types DATABASE_PASSWORD as possibly-absent (string | undefined)", () => {
		expectTypeOf<Env["DATABASE_PASSWORD"]>().toEqualTypeOf<string | undefined>();
	});
});
