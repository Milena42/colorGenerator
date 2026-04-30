import { Color, type MockupColors, type Theme } from './common';
import { hMinus } from './math';

type HFromL = (l: number) => number;
export type SchemeType = 'mono' | 'step2' | 'step3' | 'gradient';

export type ThemeParams<T extends string, R extends string> = {
    themeKeys: readonly T[];
    roleKeys: readonly R[];
    themes: Record<T, Theme<R>>;
};

export type ChromaParams = {
    accentC: number;
    bgC: number;
};

export function generateFromWheelMono<T extends string, R extends string>(
    accentH: number,
    themeParams: ThemeParams<T, R>,
    chroma?: ChromaParams,
) {
    const hFromL: HFromL = () => {
        return accentH;
    };
    return generateFromWheel(hFromL, themeParams, chroma);
}

export function generateFromWheelStep2<T extends string, R extends string>(
    accentH: number,
    bgH: number,
    themeParams: ThemeParams<T, R>,
    chroma?: ChromaParams,
) {
    const hFromL: HFromL = (l) => {
        if (35 <= l && l <= 80) return accentH;
        return bgH;
    };
    return generateFromWheel(hFromL, themeParams, chroma);
}

export function generateFromWheelStep3<T extends string, R extends string>(
    accentH: number,
    darkH: number,
    lightH: number,
    themeParams: ThemeParams<T, R>,
    chroma?: ChromaParams,
) {
    const hFromL: HFromL = (l) => {
        if (l < 35) return darkH;
        if (l <= 80) return accentH;
        return lightH;
    };
    return generateFromWheel(hFromL, themeParams, chroma);
}

export function generateFromWheelGradient<T extends string, R extends string>(
    accentH: number,
    darkH: number,
    lightH: number,
    themeParams: ThemeParams<T, R>,
    chroma?: ChromaParams,
) {
    const hFromL: HFromL = (l) => {
        /*TODO не работает с несимметричным положением кружочков */
        return ((2 * hMinus(lightH, accentH) * (l - 50)) / 100 + accentH + 360) % 360;
    };
    return generateFromWheel(hFromL, themeParams, chroma);
}

function generateFromWheel<T extends string, R extends string>(
    hFromL: HFromL,
    themeParams: ThemeParams<T, R>,
    chroma?: ChromaParams,
) {
    const { themeKeys, roleKeys, themes } = themeParams;
    const { accentC, bgC } = chroma ?? { accentC: 1, bgC: 1 };

    const generatedThemes: Record<T, MockupColors<R>> = Object.create(null);
    themeKeys.forEach((themeName) => {
        const themeRules = themes[themeName];

        const generatedTheme: MockupColors<R> = Object.create(null);
        roleKeys.forEach((roleName) => {
            const { l, cMax, isAccent } = themeRules[roleName];

            const h = hFromL(l);

            const c = isAccent ? cMax * accentC : cMax * bgC;

            const elem = new Color(l, { c, h });
            elem.adjustForRGB();

            generatedTheme[roleName] = elem;
        });

        generatedThemes[themeName] = generatedTheme;
    });

    return generatedThemes;
}
