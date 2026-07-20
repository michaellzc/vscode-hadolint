import * as assert from "node:assert";
import {getRuleUrl, processHadolintMessage} from "./hadolint";

suite("processHadolintMessage", () => {
	test("parses a rule violation", () => {
		assert.deepStrictEqual(
			processHadolintMessage(
				"/tmp/Dockerfile:3 DL3006 warning: Always tag the version of an image explicitly",
			),
			{
				lineNumber: 3,
				rule: "DL3006",
				message: "warning: Always tag the version of an image explicitly",
			},
		);
	});

	test("parses a shellcheck violation", () => {
		assert.deepStrictEqual(
			processHadolintMessage(
				"/tmp/Dockerfile:5 SC2086 info: Double quote to prevent globbing",
			),
			{
				lineNumber: 5,
				rule: "SC2086",
				message: "info: Double quote to prevent globbing",
			},
		);
	});

	// Regression: ExiaSR/vscode-hadolint#60, #89. Parse errors are reported as
	// <file>:<line>:<column> <message> with no rule code. The rule-violation
	// pattern used to match these too, taking the column as the line number and
	// the first word of the message as the rule id.
	test("parses a parse error without mistaking the column for the line", () => {
		assert.deepStrictEqual(
			processHadolintMessage("/tmp/Dockerfile:2:9 expecting the workdir path"),
			{
				lineNumber: 2,
				rule: null,
				message: "expecting the workdir path",
			},
		);
	});

	test("parses a parse error on a Windows path", () => {
		assert.deepStrictEqual(
			processHadolintMessage(
				"C:\\Users\\alan\\repos\\buggy.Dockerfile:2:9 expecting the workdir path",
			),
			{
				lineNumber: 2,
				rule: null,
				message: "expecting the workdir path",
			},
		);
	});

	test("returns null for output it cannot parse", () => {
		assert.strictEqual(processHadolintMessage("total garbage line"), null);
	});
});

suite("getRuleUrl", () => {
	test("links hadolint rules to the hadolint wiki", () => {
		assert.strictEqual(
			getRuleUrl("DL3006"),
			"https://github.com/hadolint/hadolint/wiki/DL3006",
		);
	});

	test("links shellcheck rules to the shellcheck wiki", () => {
		assert.strictEqual(
			getRuleUrl("SC2086"),
			"https://github.com/koalaman/shellcheck/wiki/SC2086",
		);
	});

	// Regression: ExiaSR/vscode-hadolint#60, #89. This used to throw, and it is
	// called while building diagnostics, so a single parse error aborted the
	// whole lint run and surfaced as "<word> is not a supported rule".
	test("returns null instead of throwing when there is no rule", () => {
		assert.strictEqual(getRuleUrl(null), null);
	});

	test("returns null instead of throwing on an unknown rule prefix", () => {
		assert.strictEqual(getRuleUrl("expecting"), null);
	});
});
