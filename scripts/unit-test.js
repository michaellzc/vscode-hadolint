// Runs the server unit tests. Mocha is driven through its API rather than its
// CLI on purpose: the CLI's bundled yargs does not load on current Node, while
// the library works fine. client/src/test/index.ts drives it the same way.
const path = require("node:path");
const {globSync} = require("glob");
const Mocha = require("mocha");

const testsRoot = path.resolve(__dirname, "..", "server", "out");

const mocha = new Mocha({ui: "tdd"});

globSync("**/*.test.js", {cwd: testsRoot}).forEach((f) => {
	mocha.addFile(path.resolve(testsRoot, f));
});

mocha.run((failures) => {
	process.exitCode = failures > 0 ? 1 : 0;
});
