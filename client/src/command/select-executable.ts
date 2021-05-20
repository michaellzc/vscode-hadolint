import * as which from "which";
// rome-ignore resolver/notFound: runtime dependency that doesn't exist
import {window, workspace} from "vscode";

export async function selectExecutable() {
	const hadolintExectuables = which.sync("hadolint", {nothrow: true, all: true});
	const selectedExectuable = await window.showQuickPick(hadolintExectuables);
	const config = workspace.getConfiguration("hadolint");
	return config.update("hadolintPath", selectedExectuable, true);
}
