import type { ContentFunctionName, ContentFunctions } from './contentScriptInterface';

export class ContentClient {
    private port: chrome.runtime.Port | null = null;
    private pendingRequests = new Map<
        number,
        (
            value:
                | ContentFunctions[ContentFunctionName]['response']
                | PromiseLike<ContentFunctions[ContentFunctionName]['response']>,
        ) => void
    >();

    constructor(tabId: number) {
        this.nextId = 0;
        this.port = chrome.tabs.connect(tabId, { name: 'stream' });
        this.port.onMessage.addListener((response) => {
            const resolve = this.pendingRequests.get(response.id);
            if (resolve) {
                resolve(response.payload);
                this.pendingRequests.delete(response.id);
            }
        });
    }

    private nextId: number;

    async call<K extends ContentFunctionName>(
        type: K,
        params: ContentFunctions[K]['params'],
    ): Promise<ContentFunctions[K]['response']> {
        return new Promise((resolve) => {
            const id = this.nextId;
            this.pendingRequests.set(id, resolve);
            this.port?.postMessage({ id, type, params });
            this.nextId = (this.nextId + 1) % 100000000;
        });
    }
}
