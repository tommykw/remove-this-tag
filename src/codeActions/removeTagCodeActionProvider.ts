
import * as vscode from 'vscode';
import * as parse5 from 'parse5';

export class RemoveTagCodeActionProvider implements vscode.CodeActionProvider {

  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {

    const codeActions: vscode.CodeAction[] = [];
    const position = range.start;
    const tagInfo = getTagAtPosition(document, position);

    if (tagInfo) {
      const action = new vscode.CodeAction(
        'Remove This Tag',
        vscode.CodeActionKind.QuickFix
      );
      action.command = {
        command: 'removeThisTag.removeTag',
        title: 'Remove This Tag',
        arguments: [document, tagInfo]
      };

      codeActions.push(action);
    }

    return codeActions;
  }
}

function getTagAtPosition(document: vscode.TextDocument, position: vscode.Position): any {
  const offset = document.offsetAt(position);
  const htmlContennt = document.getText();

  const documentFragment = parse5.parse(htmlContennt, { sourceCodeLocationInfo: true });

  return findNodeAtOffset(documentFragment, offset);
}

function findNodeAtOffset(node: any, offset: number): any {
  if (node.sourceCodeLocation) {
    const startOffset = node.sourceCodeLocation.startOffset;
    const endOffset = node.sourceCodeLocation.endOffset;

    if (startOffset <= offset && offset <= endOffset) {
      if (node.nodeName !== '#text') {
        return node;
      }
    }
  }

  if (node.childNodes) {
    for (const child of node.childNodes) {
      const found = findNodeAtOffset(child, offset);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

