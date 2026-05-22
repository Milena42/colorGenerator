import type { ContentFunctionName, ContentFunctions } from './contentScriptInterface';

const handlers: {
    [K in ContentFunctionName]: (
        p: ContentFunctions[K]['params'],
    ) => ContentFunctions[K]['response'];
} = {
    getCssVariables: () => {
        const computedStyle = window.getComputedStyle(document.body);

        const result: Record<string, string> = {};
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
        document.body.style = css;
    },
};

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((request) => {
        const handler = handlers[request.type as ContentFunctionName];
        if (handler) {
            const result = handler(request.params);
            port.postMessage({ id: request.id, payload: result });
        }
    });
});
