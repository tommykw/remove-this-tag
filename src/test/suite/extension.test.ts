import * as assert from 'assert';
import * as vscode from 'vscode';
import { before, after, describe, it } from 'mocha';

describe('Tag Remover Extension Test Suite', () => {
    let document: vscode.TextDocument;
    let editor: vscode.TextEditor;

    const openTestDocument = async (content: string, language: string = 'html') => {
        document = await vscode.workspace.openTextDocument({
            content,
            language
        });
        editor = await vscode.window.showTextDocument(document);
    };

    const getCodeActions = async (range: vscode.Range) => {
        return await vscode.commands.executeCommand<vscode.CodeAction[]>(
            'vscode.executeCodeActionProvider',
            document.uri,
            range
        );
    };

    const applyCodeAction = async (action: vscode.CodeAction) => {
        if (action.edit) {
            await vscode.workspace.applyEdit(action.edit);
        }
    };

    describe('HTML Edge Cases', () => {
        it('should handle malformed tags', async () => {
            await openTestDocument('<div class="test>content</div>');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            assert.strictEqual(actions?.length, 0);
        });

        it('should handle tags with special characters', async () => {
            await openTestDocument('<div data-test="special&quot;">content</div>');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '');
        });

        it('should handle script and style tags', async () => {
            await openTestDocument('<style>\n.test { color: red; }\n</style>');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '');
        });
    });

    describe('Remove Tag functionality', () => {
        it('should remove a simple tag and its content', async () => {
            await openTestDocument('<div>test content</div>');
            const position = new vscode.Position(0, 1); // カーソルを<div>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            assert.strictEqual(actions?.length, 1);
            assert.strictEqual(actions[0].title, 'Remove this tag');
            
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '');
        });

        it('should remove only the selected tag when nested', async () => {
            await openTestDocument('<outer>text<inner>inner content</inner>more text</outer>');
            const position = new vscode.Position(0, 12); // カーソルを<inner>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<outer>textmore text</outer>');
        });

        it('should handle self-closing tags', async () => {
            await openTestDocument('<div><img src="test.jpg" /></div>');
            const position = new vscode.Position(0, 7); // カーソルを<img>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<div></div>');
        });

        it('should handle multiline tags', async () => {
            await openTestDocument(`<body>
  <div>
    content
  </div>
</body>`);
            const position = new vscode.Position(1, 3); // カーソルを<div>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<body>\n</body>');
        });

        it('should handle tags with attributes', async () => {
            await openTestDocument('<div class="test" id="main">content</div>');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '');
        });

        it('should not provide actions outside of tags', async () => {
            await openTestDocument('text <div>content</div> text');
            const position = new vscode.Position(0, 0); // カーソルをタグの外に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            assert.strictEqual(actions?.length, 0);
        });

        it('should handle multiple tags on the same line', async () => {
            await openTestDocument('<span>one</span><div>two</div><p>three</p>');
            const position = new vscode.Position(0, 18); // カーソルを<div>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<span>one</span><p>three</p>');
        });
    });

    describe('React/TSX Edge Cases', () => {
        it('should handle dynamic component names', async () => {
            await openTestDocument('<Component.SubComponent>content</Component.SubComponent>', 'typescriptreact');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '');
        });

        it('should handle complex JSX expressions', async () => {
            await openTestDocument(
                '<div prop={`template ${expression}`}>{items.map(item => <Item key={item.id} {...item} />)}</div>',
                'typescriptreact'
            );
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '');
        });
    });

    describe('JSX/TSX Support', () => {
        it('should remove React component tags', async () => {
            await openTestDocument('<Button onClick={() => {}}>Click me</Button>');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '');
        });

        it('should handle nested JSX components', async () => {
            await openTestDocument(
                '<Container><Button><Icon />Click me</Button></Container>'
            );
            const position = new vscode.Position(0, 12); // カーソルを<Button>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<Container></Container>');
        });

        it('should handle JSX fragments', async () => {
            await openTestDocument(
                '<><Button>Click me</Button><Text>Hello</Text></>'
            );
            const position = new vscode.Position(0, 3); // カーソルを<Button>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<><Text>Hello</Text></>');
        });

        it('should handle components with complex props', async () => {
            await openTestDocument(
                '<Button variant="primary" disabled={isDisabled} style={{ color: "red" }}>Click me</Button>'
            );
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '');
        });
    });

    describe('Vue.js Edge Cases', () => {
        it('should handle dynamic components', async () => {
            await openTestDocument(
                '<template><component :is="dynamicComponent">content</component></template>',
                'vue'
            );
            const position = new vscode.Position(0, 10);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '<template></template>');
        });

        it('should handle nested slots', async () => {
            await openTestDocument(
                '<template><Component><template #header><slot name="title"/></template></Component></template>',
                'vue'
            );
            const position = new vscode.Position(0, 10);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            assert.strictEqual(document.getText(), '<template></template>');
        });
    });

    describe('Vue.js Support', () => {
        it('should remove Vue template tags', async () => {
            await openTestDocument('<template><div>Hello Vue</div></template>', 'vue');
            const position = new vscode.Position(0, 10); // カーソルを<div>の中に
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<template></template>');
        });

        it('should handle Vue components', async () => {
            await openTestDocument('<template><MyComponent v-if="show">content</MyComponent></template>', 'vue');
            const position = new vscode.Position(0, 10);
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText(), '<template></template>');
        });

        it('should handle Vue directives', async () => {
            await openTestDocument(`
              <template>
                <div v-for="item in items" :key="item.id">
                  {{ item.name }}
                </div>
              </template>
            `, 'vue');
            const position = new vscode.Position(2, 12);
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(document.getText().trim(), '<template>\n          </template>');
        });

        it('should handle nested Vue components with slots', async () => {
            await openTestDocument(`
              <template>
                <Layout>
                  <template #header>
                    <Header />
                  </template>
                  <Content />
                </Layout>
              </template>
            `, 'vue');
            const position = new vscode.Position(3, 14);
            const range = new vscode.Range(position, position);
            
            const actions = await getCodeActions(range);
            await applyCodeAction(actions[0]);
            
            assert.strictEqual(
                document.getText().trim(),
                '<template>\n            <Layout>\n              \n              <Content />\n            </Layout>\n          </template>'
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid cursor positions', async () => {
            await openTestDocument('text outside <div>content</div> tags');
            const position = new vscode.Position(0, 0);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            assert.strictEqual(actions?.length, 0);
        });

        it('should handle incomplete tags', async () => {
            await openTestDocument('<div>content');
            const position = new vscode.Position(0, 1);
            const range = new vscode.Range(position, position);
            const actions = await getCodeActions(range);
            assert.strictEqual(actions?.length, 0);
        });
    });
});        