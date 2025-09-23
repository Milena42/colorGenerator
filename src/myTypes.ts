import chroma from 'chroma-js';
import { cartesianFromPolar } from './math';

export interface OklchColor {
    l: number;
    c: number;
    h: number;
}

export class ColorInMap {
    l: number;
    c: number;
    h: number;

    x: number;
    y: number;
    /**количество */
    q: number;
    constructor(l: number, c: number, h: number, x: number, y: number, q: number) {
        this.l = l;
        this.c = c;
        this.h = h;
        this.x = x;
        this.y = y;
        this.q = q;
    }

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
