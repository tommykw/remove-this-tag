import { TagProcessor, TagInfo } from './types';

export class HTMLTagProcessor implements TagProcessor {
    canHandle(languageId: string): boolean {
        return languageId === 'html';
    }

    findTagAtPosition(text: string, offset: number): TagInfo | null {
        const tagRegex = /<\/?([a-zA-Z][^>\s]*)[^>]*>/g;
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            if (offset >= match.index && offset <= match.index + match[0].length) {
                return {
                    tagName: match[1],
                    startOffset: match.index,
                    endOffset: match.index + match[0].length,
                    hasClosingTag: !match[0].endsWith('/>'),
                };
            }
        }
        return null;
    }

    getTagRange(text: string, tagInfo: TagInfo): { start: number; end: number } {
        if (!tagInfo.hasClosingTag) {
            return { start: tagInfo.startOffset, end: tagInfo.endOffset };
        }

        const closeTagRegex = new RegExp(`</${tagInfo.tagName}>`, 'g');
        closeTagRegex.lastIndex = tagInfo.endOffset;
        const closeMatch = closeTagRegex.exec(text);

        return {
            start: tagInfo.startOffset,
            end: closeMatch ? closeMatch.index + closeMatch[0].length : tagInfo.endOffset
        };
    }
} 