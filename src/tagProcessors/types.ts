export interface TagInfo {
    tagName: string;
    startOffset: number;
    endOffset: number;
    hasClosingTag: boolean;
}

export interface TagProcessor {
    canHandle(languageId: string): boolean;
    findTagAtPosition(text: string, offset: number): TagInfo | null;
    getTagRange(text: string, tagInfo: TagInfo): { start: number; end: number };
} 