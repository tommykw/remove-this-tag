import * as vscode from 'vscode';
import { TagProcessorFactory } from './tagProcessors/tagProcessorFactory';

export function activate(context: vscode.ExtensionContext) {
	const provider = new TagRemoverActionProvider();
	
	// Extended language selector
	const selector = [
		{ scheme: 'file', language: 'html' },
		{ scheme: 'untitled', language: 'html' },
		{ scheme: 'file', language: 'typescriptreact' },
		{ scheme: 'untitled', language: 'typescriptreact' },
		{ scheme: 'file', language: 'javascriptreact' },
		{ scheme: 'untitled', language: 'javascriptreact' },
		{ scheme: 'file', language: 'vue' },
		{ scheme: 'untitled', language: 'vue' }
	];

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(selector, provider, {
				providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
		})
	);
}

class TagRemoverActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];
	
	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken
	): vscode.CodeAction[] {
		try {
			const processor = TagProcessorFactory.getProcessor(document.languageId);
			if (!processor) {return [];}

			const text = document.getText();
			const cursorOffset = document.offsetAt(range.start);

			const tagInfo = processor.findTagAtPosition(text, cursorOffset);
			if (!tagInfo) {return [];}

			const { start, end } = processor.getTagRange(text, tagInfo);
			const tagRange = new vscode.Range(
				document.positionAt(start),
				document.positionAt(end)
			);

			const action = new vscode.CodeAction('Remove this tag', vscode.CodeActionKind.QuickFix);
			action.edit = new vscode.WorkspaceEdit();
			action.edit.delete(document.uri, tagRange);
			action.isPreferred = true;
			return [action];
		} catch (error) {
			console.error('Error:', error);
			return [];
		}
	}
}

