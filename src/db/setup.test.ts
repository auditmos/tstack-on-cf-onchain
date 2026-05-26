import { getDb, initDatabase, markDbInitSkipped } from "./setup";

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

describe("getDb when uninitialized", () => {
	it("names missing vars previously recorded via markDbInitSkipped", () => {
		markDbInitSkipped(["DATABASE_HOST", "DATABASE_PASSWORD"]);
		expect(() => getDb()).toThrow(/DATABASE_HOST.*DATABASE_PASSWORD/);
	});

	it("falls back to generic guidance when nothing was recorded", () => {
		markDbInitSkipped([]);
		expect(() => getDb()).toThrow(/Database not initialized/);
	});
});
