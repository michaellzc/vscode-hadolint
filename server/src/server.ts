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
	outputLevel: string;
	hadolintPath: string;
}

const HadolintSeverity = {
	error: DiagnosticSeverity.Error,
	warning: DiagnosticSeverity.Warning,
	info: DiagnosticSeverity.Information,
	hint: DiagnosticSeverity.Hint,
};

// Creates the LSP connection
const connection = createConnection(ProposedFeatures.all);

// Create a manager for open text documents
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

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

	let diagnostics: Array<Diagnostic> = [];
	let lines = textDocument.getText().split(/\r?\n/g);
	let dockerfilePath = getFileSystemPath(URI.parse(textDocument.uri));

	try {
		const hadolintResults = hadolintService.lint(
			dockerfilePath,
			settings.hadolintPath,
			getFileSystemPath(URI.parse(workspaceFolder)),
		);
		// Format diagnostics
		hadolintResults.forEach((result, index) => {
			if (index > settings.maxNumberOfProblems) {
				return;
			}
			let diagnosic: Diagnostic = {
				// rome-ignore lint/ts/noExplicitAny
				severity: (<any>HadolintSeverity)[settings.outputLevel],
				range: {
					start: {line: result.lineNumber - 1, character: 0},
					end: {
						line: result.lineNumber - 1,
						character: lines[result.lineNumber - 1].length,
					},
				},
				message: `[hadolint] ${result.message} (${result.rule})`,
			};
			diagnostics.push(diagnosic);
		});
		// Send the computed diagnostics to VSCode.
		connection.sendDiagnostics({uri: textDocument.uri, diagnostics});
	} catch (err) {
		connection.window.showErrorMessage(`hadolint: ${err.message}`);
	}
}

documents.onDidOpen((event) => {
	connection.console.log(
		`[hadolint(${process.pid}) ${workspaceFolder}] Document opened: ${event.document.uri}`,
	);
	validateTextDocument(event.document);
});
documents.onDidSave((event) => {
	validateTextDocument(event.document);
});
documents.listen(connection);

connection.onInitialize((params) => {
	workspaceFolder = params.rootUri;
	connection.console.log(
		`[hadolint(${process.pid}) ${workspaceFolder}] Started and initialize received`,
	);
	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
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
