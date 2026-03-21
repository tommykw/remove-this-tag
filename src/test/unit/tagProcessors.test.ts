import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';
import { HTMLTagProcessor } from '../../tagProcessors/htmlTagProcessor';
import { ReactTagProcessor } from '../../tagProcessors/reactTagProcessor';
import { TagProcessorFactory } from '../../tagProcessors/tagProcessorFactory';
import { VueTagProcessor } from '../../tagProcessors/vueTagProcessor';

describe('Tag Processor Unit Tests', () => {
    it('HTML: nested same-name tags resolve to the correct closing tag', () => {
        const processor = new HTMLTagProcessor();
        const text = '<div><div>inner</div></div>';
        const tagInfo = processor.findTagAtPosition(text, 1);

        assert.ok(tagInfo);
        const range = processor.getTagRange(text, tagInfo!);
        assert.strictEqual(text.slice(range.start, range.end), '<div><div>inner</div></div>');
    });

    it('HTML: self-closing tags only remove the current token', () => {
        const processor = new HTMLTagProcessor();
        const text = '<div><img src="x.png" /></div>';
        const tagInfo = processor.findTagAtPosition(text, text.indexOf('<img') + 2);

        assert.ok(tagInfo);
        const range = processor.getTagRange(text, tagInfo!);
        assert.strictEqual(text.slice(range.start, range.end), '<img src="x.png" />');
    });

    it('HTML: when closing tag is missing, falls back to opening tag range', () => {
        const processor = new HTMLTagProcessor();
        const text = '<div>broken';
        const tagInfo = processor.findTagAtPosition(text, 1);

        assert.ok(tagInfo);
        const range = processor.getTagRange(text, tagInfo!);
        assert.strictEqual(text.slice(range.start, range.end), '<div>');
    });

    it('HTML: closing-tag cursor only removes the closing tag token', () => {
        const processor = new HTMLTagProcessor();
        const text = '<div>content</div>';
        const closingOffset = text.indexOf('</div>') + 2;
        const tagInfo = processor.findTagAtPosition(text, closingOffset);

        assert.ok(tagInfo);
        assert.strictEqual(tagInfo!.isClosingTag, true);

        const range = processor.getTagRange(text, tagInfo!);
        assert.strictEqual(text.slice(range.start, range.end), '</div>');
    });

    it('React: marks closing tags correctly', () => {
        const processor = new ReactTagProcessor();
        const text = '<Button>Click</Button>';
        const closingOffset = text.indexOf('</Button>') + 3;
        const tagInfo = processor.findTagAtPosition(text, closingOffset);

        assert.ok(tagInfo);
        assert.strictEqual(tagInfo!.isClosingTag, true);
    });

    it('Vue: only returns tags inside <template>', () => {
        const processor = new VueTagProcessor();
        const text = '<script setup>const n = 1;</script><template><div>ok</div></template>';
        const scriptOffset = text.indexOf('<script') + 2;
        const divOffset = text.indexOf('<div') + 2;

        const scriptTagInfo = processor.findTagAtPosition(text, scriptOffset);
        const divTagInfo = processor.findTagAtPosition(text, divOffset);

        assert.strictEqual(scriptTagInfo, null);
        assert.ok(divTagInfo);
        assert.strictEqual(divTagInfo!.tagName, 'div');
    });

    it('Factory: returns processor instances for supported languages and null for others', () => {
        assert.ok(TagProcessorFactory.getProcessor('html'));
        assert.ok(TagProcessorFactory.getProcessor('typescriptreact'));
        assert.ok(TagProcessorFactory.getProcessor('javascriptreact'));
        assert.ok(TagProcessorFactory.getProcessor('vue'));
        assert.strictEqual(TagProcessorFactory.getProcessor('markdown'), null);
    });
});

describe('Extension Manifest Sanity', () => {
    it('is configured as a VS Code extension entry point with expected languages', () => {
        const manifestPath = path.resolve(__dirname, '../../../package.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
            engines: { vscode: string };
            main: string;
            activationEvents: string[];
            contributes: { languages: Array<{ id: string }> };
        };

        assert.strictEqual(typeof manifest.engines.vscode, 'string');
        assert.ok(manifest.main.endsWith('dist/extension.js'));
        assert.ok(manifest.activationEvents.includes('onLanguage:html'));
        assert.ok(manifest.activationEvents.includes('onLanguage:typescriptreact'));
        assert.ok(manifest.activationEvents.includes('onLanguage:javascriptreact'));
        assert.ok(manifest.activationEvents.includes('onLanguage:vue'));

        const languageIds = manifest.contributes.languages.map((lang) => lang.id);
        assert.ok(languageIds.includes('html'));
        assert.ok(languageIds.includes('typescriptreact'));
        assert.ok(languageIds.includes('javascriptreact'));
        assert.ok(languageIds.includes('vue'));
    });
});
