import { TagProcessor, TagInfo } from './types';
import { HTMLTagProcessor } from './htmlTagProcessor';

export class ReactTagProcessor implements TagProcessor {
    canHandle(languageId: string): boolean {
        return languageId === 'typescriptreact' || languageId === 'javascriptreact';
    }

    findTagAtPosition(text: string, offset: number): TagInfo | null {
        // Search only within a limited range around the cursor
        const searchStart = Math.max(0, offset - 1000);
        const searchEnd = Math.min(text.length, offset + 1000);
        const relevantText = text.substring(searchStart, searchEnd);

        const tagRegex = /<\/?([A-Za-z][^\s>/]*)[^>]*>/g;
        let match;
        let bestMatch = null;
        let bestDistance = Infinity;

        while ((match = tagRegex.exec(relevantText)) !== null) {
            const tagStart = match.index + searchStart;
            const tagEnd = tagStart + match[0].length;

            if (tagStart <= offset && offset <= tagEnd) {
                const distance = Math.min(
                    Math.abs(offset - tagStart),
                    Math.abs(offset - tagEnd)
                );

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = {
                        tagName: match[1],
                        startOffset: tagStart,
                        endOffset: tagEnd,
                        hasClosingTag: !match[0].endsWith('/>'),
                    };
                }
            }
        }

        return bestMatch;
    }

    getTagRange(text: string, tagInfo: TagInfo): { start: number; end: number } {
        return new HTMLTagProcessor().getTagRange(text, tagInfo);
    }
} 