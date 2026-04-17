import { Color, type MockupColors, type Theme } from '@/generator/common';
import { maxCAccent, maxCBg } from '@/generator/themesExample';
import { hMinus } from '@/utilities/math';

type HFromL = (l: number) => number;
export type SchemeType = 'mono' | 'step2' | 'step3' | 'gradient';

export function generateFromWheel<T extends string, R extends string>(
    accentC: number,
    bgC: number,
    accentH: number,
    darkH: number,
    lightH: number,
    schemeType: SchemeType,
    themeKeys: readonly T[],
    roleKeys: readonly R[],
    themes: Record<T, Theme<R>>,
) {
    const schemeRulesFromInputs: Record<SchemeType, HFromL> = {
        mono: () => {
            return accentH;
        },

        step2: (l) => {
            if (35 <= l && l <= 80) return accentH;
            return darkH;
        },

        gradient: (l) => {
            /*TODO не работает с несимметричным положением кружочков */
            return ((2 * hMinus(lightH, accentH) * (l - 50)) / 100 + accentH + 360) % 360;
        },

        step3: (l) => {
            if (l < 35) return darkH;
            if (l <= 80) return accentH;
            return lightH;
        },
    };

    const generatedThemes: Record<T, MockupColors<R>> = Object.create(null);
    themeKeys.forEach((themeName) => {
        const themeRules = themes[themeName];

        const generatedTheme: MockupColors<R> = Object.create(null);
        roleKeys.forEach((roleName) => {
            const { l, cMax, isAccent } = themeRules[roleName];

            const h = schemeRulesFromInputs[schemeType](l);

            const c = isAccent ? (cMax * accentC) / maxCAccent : (cMax * bgC) / maxCBg;

            const elem = new Color(l, { c, h });
            elem.adjustForRGB();

            generatedTheme[roleName] = elem;
        });

        generatedThemes[themeName] = generatedTheme;
    });

    return generatedThemes;
}
