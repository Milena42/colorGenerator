import type { ContentFunctionName, ContentFunctions } from './contentScriptInterface';

let root: HTMLElement;

const handlers: {
    [K in ContentFunctionName]: (
        p: ContentFunctions[K]['params'],
    ) => ContentFunctions[K]['response'];
} = {
    setRoot: ({ selector }) => {
        const r = document.querySelector(selector);
        if (r && r instanceof HTMLElement) {
            root = r;
            return 'ok';
        } else {
            return 'notFound';
        }
    },

    getCssVariables: () => {
        const computedStyle = window.getComputedStyle(root);

        const result: Record<string, string> = Object.create(null);
        for (let i = 0; i < computedStyle.length; i++) {
            const propName = computedStyle[i];

            if (propName.startsWith('--')) {
                const value = computedStyle.getPropertyValue(propName).trim();
                if (CSS.supports('color', value)) {
                    result[propName.replace(/^[\s-]+/, '')] = value;
                }
            }
        }

        return result;
    },

    setCss: ({ css }) => {
        root.style = css;
    },
};

handlers.setRoot({ selector: ':root' });

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((request) => {
        const handler = handlers[request.type as ContentFunctionName];
        if (handler) {
            const result = handler(request.params);
            port.postMessage({ id: request.id, payload: result });
        }
    });
});
