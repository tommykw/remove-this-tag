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

        const tagRegex = /<\/?([a-zA-Z][^>\s]*)[^>]*>/g;
        let match;
        let bestMatch = null;
        let bestDistance = Infinity;

        while ((match = tagRegex.exec(relevantText)) !== null) {
            const tagStart = match.index + offsetAdjustment;
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