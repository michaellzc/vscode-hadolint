import * as which from 'which';
import * as vscode from 'vscode';

export async function selectExecutable() {
  const hadolintExectuables = which.sync('hadolint', { nothrow: true, all: true });
  const selectedExectuable = await vscode.window.showQuickPick(hadolintExectuables);
  const config = vscode.workspace.getConfiguration('hadolint');
  return config.update('hadolintPath', selectedExectuable, true);
}
