import { TagProcessor, TagInfo } from './types';

interface ParsedTag {
    tagName: string;
    startOffset: number;
    endOffset: number;
    isClosingTag: boolean;
    isSelfClosing: boolean;
}

function parseTag(matchText: string, matchIndex: number, tagName: string): ParsedTag {
    const isClosingTag = matchText.startsWith('</');
    const isSelfClosing = !isClosingTag && /\/\s*>$/.test(matchText);

    return {
        tagName,
        startOffset: matchIndex,
        endOffset: matchIndex + matchText.length,
        isClosingTag,
        isSelfClosing
    };
}

function findMatchingCloseTag(text: string, tagInfo: TagInfo): number {
    if (!tagInfo.hasClosingTag || tagInfo.isClosingTag) {
        return tagInfo.endOffset;
    }

    const tagName = tagInfo.tagName;
    const nestedOpenings: number[] = [tagInfo.startOffset];
    const regex = new RegExp(`<\\/?(${tagName})\\b[^>]*>`, 'g');
    regex.lastIndex = tagInfo.endOffset;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        const parsed = parseTag(match[0], match.index, match[1]);

        if (parsed.isSelfClosing) {
            continue;
        }

        if (parsed.isClosingTag) {
            nestedOpenings.pop();
            if (nestedOpenings.length === 0) {
                return parsed.endOffset;
            }
        } else {
            nestedOpenings.push(parsed.startOffset);
        }
    }

    return tagInfo.endOffset;
}

export class HTMLTagProcessor implements TagProcessor {
    canHandle(languageId: string): boolean {
        return languageId === 'html';
    }

    findTagAtPosition(text: string, offset: number): TagInfo | null {
        let match: RegExpExecArray | null;

        const tagRegex = /<\/?([a-zA-Z][^>\s]*)[^>]*>/g;

        while ((match = tagRegex.exec(text)) !== null) {
            const parsed = parseTag(match[0], match.index, match[1]);

            if (offset >= parsed.startOffset && offset <= parsed.endOffset) {
                return {
                    tagName: parsed.tagName,
                    startOffset: parsed.startOffset,
                    endOffset: parsed.endOffset,
                    hasClosingTag: !parsed.isSelfClosing,
                    isClosingTag: parsed.isClosingTag
                };
            }
        }
        return null;
    }

    getTagRange(text: string, tagInfo: TagInfo): { start: number; end: number } {
        if (tagInfo.isClosingTag) {
            return { start: tagInfo.startOffset, end: tagInfo.endOffset };
        }

        return {
            start: tagInfo.startOffset,
            end: findMatchingCloseTag(text, tagInfo)
        };
    }
}
