import { Color, type MockupColors, type Theme } from '@/generator/common';
import { maxCAccent, maxCBg } from '@/generator/themesExample';
import { hMinus } from '@/utilities/math';

type HFromL = (l: number) => number;
export type SchemeType = 'mono' | 'step2' | 'step3' | 'gradient';

export function generateFromWheel(
    themes: Map<string, Theme>,
    accentC: number,
    bgC: number,
    accentH: number,
    darkH: number,
    lightH: number,
    schemeType: SchemeType,
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

    const generatedThemes = new Map<string, MockupColors>();

    themes.forEach((themeRules, name) => {
        const generatedTheme: MockupColors = {};

        Object.entries(themeRules).forEach(([key, rule]) => {
            const { l, cMax, isAccent } = rule;

            const h = schemeRulesFromInputs[schemeType](l);

            const c = isAccent ? (cMax * accentC) / maxCAccent : (cMax * bgC) / maxCBg;

            const elem = new Color(l, { c, h });
            elem.adjustForRGB();

            generatedTheme[key] = elem;
        });

        generatedThemes.set(name, generatedTheme);
    });

    return generatedThemes;
}
