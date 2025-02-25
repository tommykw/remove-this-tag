import { TagProcessor, TagInfo } from './types';

export class VueTagProcessor implements TagProcessor {
    private lastTemplateMatch: { start: number; end: number; } | null = null;
    private lastText: string = '';

    canHandle(languageId: string): boolean {
        return languageId === 'vue';
    }

    findTagAtPosition(text: string, offset: number): TagInfo | null {
        if (this.lastText !== text) {
            const templateMatch = /<template>\s*([\s\S]*?)\s*<\/template>/.exec(text);
            if (!templateMatch) {return null;}

            this.lastTemplateMatch = {
                start: templateMatch.index + '<template>'.length,
                end: templateMatch.index + templateMatch[0].length
            };
            this.lastText = text;
        }

        if (!this.lastTemplateMatch || 
            offset < this.lastTemplateMatch.start || 
            offset > this.lastTemplateMatch.end) {
            return null;
        }

        const relevantText = text.substring(
            Math.max(this.lastTemplateMatch.start, offset - 1000),
            Math.min(this.lastTemplateMatch.end, offset + 1000)
        );
        const offsetAdjustment = Math.max(this.lastTemplateMatch.start, offset - 1000);

        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9.-]*(?:\.[a-zA-Z][a-zA-Z0-9.-]*)*)[^>]*?(?:\/)?>/g;
        let match;
        let bestMatch = null;
        let bestDistance = Infinity;
        let stack: { tagName: string; start: number; content: string; }[] = [];

        while ((match = tagRegex.exec(relevantText)) !== null) {
            const tagStart = match.index + offsetAdjustment;
            const tagEnd = tagStart + match[0].length;
            const isClosingTag = match[0].startsWith('</');
            const isSelfClosing = match[0].endsWith('/>') || /^(img|br|hr|input|meta)$/i.test(match[1]);

            if (!isClosingTag && !isSelfClosing) {
                stack.push({
                    tagName: match[1],
                    start: tagStart,
                    content: match[0]
                });
            } else if (isClosingTag && stack.length > 0) {
                const openTag = stack.pop();
                if (openTag && openTag.tagName === match[1]) {
                    const fullTagStart = openTag.start;
                    const fullTagEnd = tagEnd;
                    
                    if (fullTagStart <= offset && offset <= fullTagEnd) {
                        const distance = Math.min(
                            Math.abs(offset - fullTagStart),
                            Math.abs(offset - fullTagEnd)
                        );

                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestMatch = {
                                tagName: match[1],
                                startOffset: fullTagStart,
                                endOffset: fullTagEnd,
                                hasClosingTag: true,
                            };
                        }
                    }
                }
            } else if (isSelfClosing && tagStart <= offset && offset <= tagEnd) {
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
                        hasClosingTag: false,
                    };
                }
            }
        }

        return bestMatch;
    }

    getTagRange(text: string, tagInfo: TagInfo): { start: number; end: number } {
        // For self-closing tags or if we already have the full range
        if (!tagInfo.hasClosingTag || tagInfo.endOffset > tagInfo.startOffset + tagInfo.tagName.length + 2) {
            return { start: tagInfo.startOffset, end: tagInfo.endOffset };
        }

        let depth = 0;
        const tagRegex = new RegExp(`</?${tagInfo.tagName}(?:\\s+[^>]*)?(?:/>|>)`, 'g');
        tagRegex.lastIndex = tagInfo.startOffset;
        
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            if (match[0].startsWith('</')) {
                depth--;
                if (depth === 0) {
                    return {
                        start: tagInfo.startOffset,
                        end: match.index + match[0].length
                    };
                }
            } else if (!match[0].endsWith('/>')) {
                depth++;
            }
        }

        return { start: tagInfo.startOffset, end: tagInfo.endOffset };
    }
}    