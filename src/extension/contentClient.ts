import type { ContentFunctionName, ContentFunctions } from './contentScriptInterface';

export class ContentClient {
    private port: chrome.runtime.Port | null = null;
    private pendingRequests = new Map<
        string,
        (
            value:
                | ContentFunctions[ContentFunctionName]['response']
                | PromiseLike<ContentFunctions[ContentFunctionName]['response']>,
        ) => void
    >();

    constructor(tabId: number) {
        this.port = chrome.tabs.connect(tabId, { name: 'stream' });
        this.port.onMessage.addListener((response) => {
            const resolve = this.pendingRequests.get(response.id);
            if (resolve) {
                resolve(response.payload);
                this.pendingRequests.delete(response.id);
            }
        });
    }

    async call<K extends ContentFunctionName>(
        type: K,
        params: ContentFunctions[K]['params'],
    ): Promise<ContentFunctions[K]['response']> {
        return new Promise((resolve) => {
            const id = Math.random().toString(36).slice(2); // ID для сопоставления //TODO
            this.pendingRequests.set(id, resolve);
            this.port?.postMessage({ id, type, params });
        });
    }
}
