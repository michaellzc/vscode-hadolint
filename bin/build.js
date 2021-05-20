#!/usr/bin/env node

const esbuild = require("esbuild");
const path = require("path");
const rimraf = require("rimraf");

const PROJECT_ROOT = process.cwd();
const SERVER_ROOT = path.join(PROJECT_ROOT, "server");
const CLIENT_ROOT = path.join(PROJECT_ROOT, "client");

/** @type {import("esbuild").BuildOptions}*/
const sharedConfig = {
	bundle: true,
	minify: true,
	sourcemap: true,
	platform: "node",
	target: "node12",
	format: "cjs",
	external: ["vscode"],
	logLevel: "info",
};

async function buildServer() {
	rimraf.sync(path.join(SERVER_ROOT, "out"));
	await esbuild.build({
		...sharedConfig,
		absWorkingDir: SERVER_ROOT,
		entryPoints: ["./src/server.ts"],
		outfile: "./out/server.js",
	});
}

async function buildClient() {
	rimraf.sync(path.join(CLIENT_ROOT, "out"));
	await esbuild.build({
		...sharedConfig,
		absWorkingDir: CLIENT_ROOT,
		entryPoints: ["./src/extension.ts"],
		outfile: "./out/extension.js",
	});
}

Promise.all([buildServer(), buildClient()]).catch((error) => {
	console.error("failed to build.");
	console.error(error.message);
	process.exit(1);
});
