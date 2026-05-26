import { initDatabase } from "./setup";

describe("initDatabase", () => {
	it("throws when host is empty", () => {
		expect(() => initDatabase({ host: "", username: "u", password: "p" })).toThrow(
			/host.*username.*password/i,
		);
	});

	it("throws when username is empty", () => {
		expect(() => initDatabase({ host: "h", username: "", password: "p" })).toThrow(
			/host.*username.*password/i,
		);
	});

	it("throws when password is empty", () => {
		expect(() => initDatabase({ host: "h", username: "u", password: "" })).toThrow(
			/host.*username.*password/i,
		);
	});
});
