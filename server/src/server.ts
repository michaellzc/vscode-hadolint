import {
	createConnection,
	type Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationNotification,
	ProposedFeatures,
	TextDocumentSyncKind,
	TextDocuments,
} from "vscode-languageserver/node";
import {TextDocument} from "vscode-languageserver-textdocument";
import {URI} from "vscode-uri";
import * as hadolintService from "./service/hadolint";
import {getFileSystemPath} from "./utils";

interface HadolintSettings {
	maxNumberOfProblems: number;
	outputLevel: "error" | "info" | "warning" | "hint";
	hadolintPath: string;
	cliOptions: string[];
}

const HadolintSeverity = {
	error: DiagnosticSeverity.Error,
	warning: DiagnosticSeverity.Warning,
	info: DiagnosticSeverity.Information,
	hint: DiagnosticSeverity.Hint,
};

// Creates the LSP connection
const connection = createConnection(ProposedFeatures.all);
// vscode lsp is stupid https://github.com/microsoft/vscode/issues/68670#issuecomment-518325168
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);

// Create a manager for open text documents
let documents: TextDocuments<TextDocument>;

// The workspace folder this server is operating on
let workspaceFolder: string | null;

async function getSettings(): Promise<HadolintSettings> {
	const result = await connection.workspace.getConfiguration({
		section: "hadolint",
	});
	return result;
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const settings = await getSettings();
	connection.console.log(
		`[hadolint(${process.pid}) ${workspaceFolder}] Current settings: ${JSON.stringify(
			settings,
		)}`,
	);

	const diagnostics: Diagnostic[] = [];
	const lines = textDocument.getText().split(/\r?\n/g);
	const dockerfilePath = getFileSystemPath(URI.parse(textDocument.uri));

	try {
		const {results: hadolintResults, messages} = hadolintService.lint(
			dockerfilePath,
			settings.hadolintPath,
			settings.cliOptions,
			getFileSystemPath(URI.parse(workspaceFolder)),
		);
		// Format diagnostics
		hadolintResults.forEach((result, index) => {
			if (index > settings.maxNumberOfProblems) {
				return;
			}
			// Output lines we couldn't parse yield null; skip rather than crash.
			if (!result) {
				return;
			}
			// Clamp into the document: hadolint can report a line past the end
			// of what we last read, e.g. while the user is still typing.
			const line = Math.min(
				Math.max(result.lineNumber - 1, 0),
				Math.max(lines.length - 1, 0),
			);
			const ruleUrl = hadolintService.getRuleUrl(result.rule);
			const diagnosic: Diagnostic = {
				severity: HadolintSeverity[settings.outputLevel],
				range: {
					start: {line, character: 0},
					end: {line, character: (lines[line] || "").length},
				},
				message: `[hadolint] ${result.message}`,
				...(result.rule ? {code: result.rule} : {}),
				...(ruleUrl ? {codeDescription: {href: ruleUrl}} : {}),
			};
			diagnostics.push(diagnosic);
		});
		// Send the computed diagnostics to VSCode.
		connection.sendDiagnostics({uri: textDocument.uri, diagnostics});
		messages.forEach((message) => {
			switch (message.level) {
				case "error": {
					connection.console.info(
						`[hadolint(${process.pid}) error: ${message.message}`,
					);
					connection.window.showErrorMessage(message.message);
					break;
				}
				case "info": {
					connection.console.info(
						`[hadolint(${process.pid}) info: ${message.message}`,
					);
					connection.window.showInformationMessage(message.message);
					break;
				}
				case "warn": {
					connection.console.info(
						`[hadolint(${process.pid}) warn: ${message.message}`,
					);
					connection.window.showWarningMessage(message.message);
					break;
				}
			}
		});
	} catch (err) {
		connection.console.error(err.stack);
		connection.window.showErrorMessage(`hadolint: ${err.message}`);
	}
}

function setupDocumentsListeners() {
	documents.listen(connection);
	documents.onDidOpen((event) => {
		connection.console.log(
			`[hadolint(${process.pid}) ${workspaceFolder}] Document is opened: ${event.document.uri}`,
		);
		validateTextDocument(event.document);
	});

	documents.onDidClose((event) => {
		connection.console.log(
			`[hadolint(${process.pid}) ${workspaceFolder}] Document is closed: ${event.document.uri}`,
		);
		connection.sendDiagnostics({uri: event.document.uri, diagnostics: []});
	});

	documents.onDidSave((event) => {
		connection.console.log(
			`[hadolint(${process.pid}) ${workspaceFolder}] Document is saved: ${event.document.uri}`,
		);
		validateTextDocument(event.document);
	});

	documents.onDidChangeContent((event) => {
		connection.console.log(
			`[hadolint(${process.pid}) ${workspaceFolder}] Document is changed: ${event.document.uri}`,
		);
		validateTextDocument(event.document);
	});
}

connection.onInitialize((params) => {
	workspaceFolder = params.rootUri;
	documents = new TextDocuments(TextDocument);
	setupDocumentsListeners();
	connection.console.log(
		`[hadolint(${process.pid}) ${workspaceFolder}] Started and initialize received`,
	);
	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				save: {
					includeText: false,
				},
				change: TextDocumentSyncKind.None,
			},
		},
	};
});

connection.onInitialized(() => {
	connection.client.register(
		DidChangeConfigurationNotification.type,
		undefined,
	);
});

connection.onDidChangeConfiguration(() => {
	documents.all().forEach(validateTextDocument);
});

connection.onDidChangeWatchedFiles(() => {
	connection.console.log(
		`[hadolint(${process.pid}) ${workspaceFolder}] Detected changes in watched files`,
	);
	documents.all().forEach(validateTextDocument);
});

connection.listen();
