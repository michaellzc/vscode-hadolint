import {
	Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationNotification,
	ProposedFeatures,
	TextDocumentSyncKind,
	TextDocuments,
	createConnection,
} from "vscode-languageserver/node";
import {URI} from "vscode-uri";
import * as hadolintService from "./service/hadolint";
import {getFileSystemPath} from "./utils";
import {TextDocument} from "vscode-languageserver-textdocument";

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

	let diagnostics: Diagnostic[] = [];
	let lines = textDocument.getText().split(/\r?\n/g);
	let dockerfilePath = getFileSystemPath(URI.parse(textDocument.uri));

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
			let diagnosic: Diagnostic = {
				severity: HadolintSeverity[settings.outputLevel],
				range: {
					start: {line: result.lineNumber - 1, character: 0},
					end: {
						line: result.lineNumber - 1,
						character: lines[result.lineNumber - 1].length,
					},
				},
				message: `[hadolint] ${result.message}`,
				code: result.rule,
				codeDescription: {
					href: hadolintService.getRuleUrl(result.rule),
				},
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
				}
				case "info": {
					connection.console.info(
						`[hadolint(${process.pid}) info: ${message.message}`,
					);
					connection.window.showInformationMessage(message.message);
				}
				case "warn": {
					connection.console.info(
						`[hadolint(${process.pid}) warn: ${message.message}`,
					);
					connection.window.showWarningMessage(message.message);
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
	connection.client.register(DidChangeConfigurationNotification.type, undefined);
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
