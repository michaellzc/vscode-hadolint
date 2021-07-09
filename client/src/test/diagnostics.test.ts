// rome-ignore resolver/notFound: runtime dependency that doesn't exist
import * as vscode from "vscode";
import * as assert from "assert";
import {activate, getDocUri} from "./helper";

suite(
	"Should get diagnostics",
	() => {
		const docUri = getDocUri("Dockerfile");
		console.info(`Openning fixture ${docUri}`);

		test(
			"Diagnoses Always tag the version of an image explicitly",
			async () => {
				await testDiagnostics(
					docUri,
					[
						{
							message: "[hadolint] warning: Always tag the version of an image explicitly",
							range: toRange(0, 0, 0, 11),
							severity: vscode.DiagnosticSeverity.Warning,
							source: "dockerfile",
						},
					],
				);
			},
		);
	},
);

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
	const start = new vscode.Position(sLine, sChar);
	const end = new vscode.Position(eLine, eChar);
	return new vscode.Range(start, end);
}

async function testDiagnostics(
	docUri: vscode.Uri,
	expectedDiagnostics: vscode.Diagnostic[],
) {
	await activate(docUri);

	const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

	assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

	expectedDiagnostics.forEach((expectedDiagnostic, i) => {
		const actualDiagnostic = actualDiagnostics[i];
		assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
		assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
		assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
	});
}
