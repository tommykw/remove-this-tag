import { TagProcessor } from './types';
import { HTMLTagProcessor } from './htmlTagProcessor';
import { VueTagProcessor } from './vueTagProcessor';
import { ReactTagProcessor } from './reactTagProcessor';

export class TagProcessorFactory {
    private static processors: TagProcessor[] = [
        new HTMLTagProcessor(),
        new VueTagProcessor(),
        new ReactTagProcessor(),
    ];

    static getProcessor(languageId: string): TagProcessor | null {
        return this.processors.find(p => p.canHandle(languageId)) || null;
    }
} 