import chroma from 'chroma-js';
import { cartesianFromPolar, polarFromCartesian } from './math';

export class Color {
    l: number;
    c: number;
    h: number;

    x: number;
    y: number;

    /**количество */
    q: number;

    constructor(l: number, ChXy: { c: number; h: number } | { x: number; y: number }, q = 1) {
        this.l = l;
        if ('x' in ChXy) {
            const { x, y } = ChXy;
            [this.c, this.h] = polarFromCartesian(x, y);
            this.x = x;
            this.y = y;
        } else {
            const { c, h } = ChXy;
            [this.x, this.y] = cartesianFromPolar(c, h);
            this.c = c;
            this.h = h;
        }
        this.q = q;
    }

    /**
     * приводит цвет к существующему в rgb
     * (путем уменьшения насыщенности)
     * @returns hex для полученного rgb
     */
    adjustForRGB(): string {
        let exist = true;
        let rgb;
        do {
            rgb = chroma.oklch(this.l / 100, this.c / 100, this.h);
            if (rgb.clipped()) {
                exist = false;
                this.c--;
                if (this.c < 0) this.c = 0;
            } else exist = true;
        } while (!exist);
        /* т.к. меняется С, меняются х и у, зависящие от С */
        [this.x, this.y] = cartesianFromPolar(this.c, this.h);

        return rgb.hex();
    }
}

//TODO naming
export const colorRoles = ['bg', 'overlay', 'accentLarge', 'accentSmall', 'text', 'textOnAccent'];
export const accentColorRoles = ['accentLarge', 'accentSmall'];
export const bgColorRoles = ['bg', 'overlay', 'text', 'textOnAccent'];
export type ColorRole = (typeof colorRoles)[number];

export type MockupColors = Record<ColorRole, string>;

export interface ColorRule {
    l: number;
    cMax: number;
}

export type Theme = Record<ColorRole, ColorRule>;
