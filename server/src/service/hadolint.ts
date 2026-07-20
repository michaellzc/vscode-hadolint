import * as spawn from "cross-spawn";

interface Message {
	level: "info" | "warn" | "error";
	message: string;
}

// source: https://github.com/AtomLinter/linter-hadolint/blob/master/lib/main.js#L45
export function processHadolintMessage(message: string): {
	lineNumber: number;
	rule: string | null;
	message: string;
} | null {
	const patterns = [
		{
			// </path/to/file>:<line-number>:<column> <message>
			// hadolint emits this shape for Dockerfile parse errors, which carry
			// no rule code. Must be tried first, otherwise the pattern below
			// mistakes the column for the line number and the first word of the
			// message for a rule id.
			regex: /^(.+):(\d+):(\d+) (.+)$/,
			cb: (m: string[]) => ({
				lineNumber: Number.parseInt(m[2], 10),
				rule: null,
				message: m[4].trim(),
			}),
		},
		{
			// </path/to/file>:<line-number> <error-code> <message>
			regex: /(.+):(\d+) (\S+) (.+)/,
			cb: (m: string[]) => ({
				lineNumber: Number.parseInt(m[2], 10),
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
	const cwd = workspacePath || process.cwd();
	const messages: Message[] = [];
	const args = cliOptions;
	console.log(
		`[hadolint] Running ${executablePath} ${[file, ...args].join(" ")} in ${cwd}`,
	);
	let {stdout, stderr, error} = spawn.sync(executablePath, [file, ...args], {
		cwd,
	});

	if (stderr?.toString()) {
		console.log(
			"[hadolint] `--no-color` flag may not supported. Falling back...",
		);
		console.log(`[hadolint] ${stderr.toString()}`);
		messages.push({
			level: "warn",
			message:
				"Please visit [ExiaSR/vscode-hadolint#44](https://github.com/ExiaSR/vscode-hadolint/issues/44#issuecomment-808756114). You may be using an outdated version of hadolint or you are running hadolint in Docker. ",
		});
		const newArgs = args.filter((item) => item !== "--no-color");
		const results = spawn.sync(executablePath, [file, ...newArgs], {cwd});
		console.log(results.stderr.toString());
		error = results.error;
		stdout = results.stdout;
	}

	if (error) {
		console.error(`[hadolint] ${error.message}`);
		console.error(error.stack);
		throw new Error(
			"Cannot find hadolint from system $PATH. Please install hadolint.",
		);
	}

	// Parse hadolint output
	const hadolintRawOutput = stdout
		.toString()
		.split(/\r?\n/g)
		.filter((result) => result !== "");
	const hadolintResults = hadolintRawOutput.map((each) =>
		processHadolintMessage(each),
	);

	return {
		results: hadolintResults,
		messages,
	};
}

// Returns null when the rule id has no documentation page, e.g. parse errors
// (which have no rule at all) or rule prefixes we don't know about. Callers
// should omit the code description rather than fail the whole lint run.
export function getRuleUrl(ruleId: string | null): string | null {
	if (!ruleId) {
		return null;
	}
	if (/^SC(.+)/.test(ruleId)) {
		return `https://github.com/koalaman/shellcheck/wiki/${ruleId}`;
	} else if (/^DL(.+)/.test(ruleId)) {
		return `https://github.com/hadolint/hadolint/wiki/${ruleId}`;
	}
	return null;
}
