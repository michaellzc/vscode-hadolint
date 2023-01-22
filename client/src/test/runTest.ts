import * as path from "path";
import * as which from "which";

import {runTests} from "@vscode/test-electron";

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(
			__dirname,
			"../",
			"../",
			"../",
		);
		console.log(`extensionDevelopmentPath: ${extensionDevelopmentPath}`);

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, "index");
		console.log(`extensionTestsPath ${extensionTestsPath}`);

		preTestCheck();

		// Download VS Code, unzip it and run the integration test
		const workspaceDir = path.resolve(
			__dirname,
			"../",
			"../",
			"../",
			"client",
			"testFixture",
		);
		console.log(`Launching vscode-test in ${workspaceDir}`);
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [workspaceDir, "--disable-extensions"],
		});
	} catch (err) {
		console.error("Failed to run tests");
		process.exit(1);
	}
}

function preTestCheck() {
	const results = which.sync("hadolint", {nothrow: true, all: true});
	if (!results) {
		console.error("`hadolint` command is not found in system path");
		throw new Error("`hadolint` command is not found in system path");
	}
	console.log(`Available hadolint binaries: ${results}`);
}

main();
