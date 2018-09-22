'use strict';

import {
  IPCMessageReader, IPCMessageWriter, createConnection,
  IConnection, TextDocuments, TextDocument,
  Diagnostic, DiagnosticSeverity, InitializeResult
} from 'vscode-languageserver';
import URI from 'vscode-uri';
import * as hadolintService from './service/hadolint';

// The settings interface describe the server relevant settings part
interface Settings {
  hadolint: HadolintSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface HadolintSettings {
  maxNumberOfProblems: number;
  outputLevel: string;
  hadolintPath: string;
}

const HadolintSeverity = {
  error: DiagnosticSeverity.Error,
  warning: DiagnosticSeverity.Warning,
  info: DiagnosticSeverity.Information,
  hint: DiagnosticSeverity.Hint
};

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize((_params): InitializeResult => {
  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: documents.syncKind
    }
  };
});

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
let outputLevel: string;
let hadolintPath: string;

function validateTextDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  let lines = textDocument.getText().split(/\r?\n/g);
  let dockerfilePath = getFileSystemPath(URI.parse(textDocument.uri));

  try {
    const hadolintResults = hadolintService.lint(dockerfilePath, hadolintPath);
    // Format diagnostics
    hadolintResults.forEach((result, index) => {
      if (index > maxNumberOfProblems) { return; }
      let diagnosic: Diagnostic = {
        severity: (<any>HadolintSeverity)[outputLevel],
        range: {
          start: { line: result.lineNumber-1, character: 0 },
          end: { line: result.lineNumber-1, character: lines[result.lineNumber-1].length }
        },
        message: `[hadolint] ${result.message} (${result.rule})`
      };
      diagnostics.push(diagnosic);
    });
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  } catch (err) {
    connection.window.showErrorMessage(`hadolint: ${err.message}`);
  }
}

// Source: https://github.com/Microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts#L269
function getFileSystemPath(uri: URI): string {
  let result = uri.fsPath;
  if (process.platform === 'win32' && result.length >= 2 && result[1] === ':') {
    // Node by default uses an upper case drive letter and ESLint uses
    // === to compare pathes which results in the equal check failing
    // if the drive letter is lower case in th URI. Ensure upper case.
    return result[0].toUpperCase() + result.substr(1);
  } else {
    return result;
  }
}

// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
  let settings = <Settings>change.settings;
  maxNumberOfProblems = settings.hadolint.maxNumberOfProblems || 100;
  outputLevel = settings.hadolint.outputLevel || 'warning';
  hadolintPath = settings.hadolint.hadolintPath;
  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event');
});

// Listen on the connection
connection.listen();
