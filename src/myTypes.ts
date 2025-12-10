import chroma from 'chroma-js';
import { cartesianFromPolar, polarFromCartesian } from './math';

export class Color {
    l: number;
    private _c: number;
    private _h: number;

    private _x: number;
    private _y: number;

    /**количество */
    q: number;

    constructor(l: number, ChXy: { c: number; h: number } | { x: number; y: number }, q = 1) {
        this.l = l;
        if ('x' in ChXy) {
            const { x, y } = ChXy;
            [this._c, this._h] = polarFromCartesian(x, y);
            this._x = x;
            this._y = y;
        } else {
            const { c, h } = ChXy;
            [this._x, this._y] = cartesianFromPolar(c, h);
            this._c = c;
            this._h = h;
        }
        this.q = q;
    }

    private recalculateCH() {
        [this._c, this._h] = polarFromCartesian(this._x, this._y);
    }
    private recalculateXY() {
        [this._x, this._y] = cartesianFromPolar(this._c, this._h);
    }

    set x(newX: number) {
        this._x = newX;
        this.recalculateCH();
    }
    set y(newY: number) {
        this._y = newY;
        this.recalculateCH();
    }
    set c(newC: number) {
        this._c = newC;
        this.recalculateXY();
    }
    set h(newH: number) {
        this._h = newH;
        this.recalculateXY();
    }
    get c() {
        return this._c;
    }
    get h() {
        return this._h;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
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
            rgb = chroma.oklch(this.l / 100, this._c / 100, this._h);
            if (rgb.clipped()) {
                exist = false;
                this._c--;
                if (this._c < 0) this._c = 0;
            } else exist = true;
        } while (!exist);
        /* т.к. меняется С, меняются х и у, зависящие от С */
        [this._x, this._y] = cartesianFromPolar(this._c, this._h);

        return rgb.hex();
    }
}

//TODO naming
export const colorRoles = [
    'bg',
    'overlay',
    'accentLarge',
    'accentSmall',
    'text',
    'textOnAccent',
    'card1',
    'card2',
    'card3',
    'accent2',
    'accent3',
];
export const accentColorRoles = ['accentLarge', 'accentSmall', 'textOnAccent', 'card1'];
export const bgColorRoles = ['bg', 'text', 'overlay'];
export const secondaryColorRoles = ['accent2', 'card2', 'accent3', 'card3'];
export type ColorRole = (typeof colorRoles)[number];

export type MockupColors = Record<ColorRole, string>;

export interface ColorRule {
    l: number;
    cMax: number;
}

export type Theme = Record<ColorRole, ColorRule>;

export const schemeTypes = ['mono', 'complementary', 'analog', 'triad'];
export type schemeType = (typeof schemeTypes)[number];
