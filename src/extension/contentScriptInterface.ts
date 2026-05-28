export interface ContentFunctions {
    setRoot: {
        params: { selector: string };
        response: 'ok' | 'notFound';
    };
    getCssVariables: {
        params: void;
        response: Record<string, string>;
    };
    setCss: {
        params: { css: string };
        response: void;
    };
}

export type ContentFunctionName = keyof ContentFunctions;
