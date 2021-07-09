"use strict";
import * as spawn from "cross-spawn";

interface Message {
	level: "info" | "warn" | "error";
	message: string;
}

// source: https://github.com/AtomLinter/linter-hadolint/blob/master/lib/main.js#L45
export function processHadolintMessage(
	message: String,
): {
	lineNumber: number;
	rule: string;
	message: string;
} {
	const patterns = [
		{
			// </path/to/file>:<line-number> <error-code> <message>
			regex: /(.+):(\d+) (\S+) (.+)/,
			cb: (m: string[]) => ({
				lineNumber: Number.parseInt(m[2]),
				rule: m[3],
				message: m[4],
			}),
		},
		{
			// </path/to/file> <error-code> <message>
			// specifying DL|SH so it won't break when the path to file has whitespaces
			regex: /(.+) ((?:DL|SH)\d+) (.+)/,
			cb: (m: string[]) => ({lineNumber: 1, rule: m[2], message: m[3]}),
		},
	];
	// eslint-disable-next-line no-restricted-syntax
	for (const pattern of patterns) {
		const match = message.match(pattern.regex);
		if (match) {
			return pattern.cb(match);
		}
	}

	return null;
}

export function lint(
	file: string,
	executablePath: string,
	cliOptions: string[],
	workspacePath: string,
) {
	let cwd = workspacePath || process.cwd();
	const messages: Message[] = [];
	const args = cliOptions;
	console.log(
		`[hadolint] Running ${executablePath} ${[file, ...args].join(" ")} in ${cwd}`,
	);
	let {stdout, stderr, error} = spawn.sync(
		executablePath,
		[file, ...args],
		{cwd},
	);

	if (stderr.toString()) {
		console.log(
			"[hadolint] `--no-color` flag may not supported. Falling back...",
		);
		console.log(`[hadolint] ${stderr.toString()}`);
		messages.push({
			level: "warn",
			message: "Please visit [ExiaSR/vscode-hadolint#44](https://github.com/ExiaSR/vscode-hadolint/issues/44#issuecomment-808756114). You may be using an outdated version of hadolint or you are running hadolint in Docker. ",
		});
		const newArgs = args.filter((item) => item !== "--no-color");
		const results = spawn.sync(executablePath, [file, ...newArgs], {cwd});
		console.log(results.stderr.toString());
		error = results.error;
		stdout = results.stdout;
	}

	if (error) {
		console.error(error);
		throw new Error(
			"Cannot find hadolint from system $PATH. Please install hadolint.",
		);
	}

	// Parse hadolint output
	const hadolintRawOutput = stdout.toString().split(/\r?\n/g).filter((result) =>
		result !== (undefined || null || "")
	);
	let hadolintResults = hadolintRawOutput.map((each) =>
		processHadolintMessage(each)
	);

	return {
		results: hadolintResults,
		messages,
	};
}

export function getRuleUrl(ruleId: string) {
	if (/^SC(.+)/.test(ruleId)) {
		return `https://github.com/koalaman/shellcheck/wiki/${ruleId}`;
	} else if (/^DL(.+)/.test(ruleId)) {
		return `https://github.com/hadolint/hadolint/wiki/${ruleId}`;
	} else {
		throw new Error(`${ruleId} is not a supported rule`);
	}
}
