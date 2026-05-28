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
                if (this._c == 0) {
                    this.l -= 0.01;
                } else {
                    this._c--; //TODO мб уменьшить шаг, см производительность
                    if (this._c < 0) this._c = 0;
                }
            } else exist = true;
        } while (!exist);
        /* т.к. меняется С, меняются х и у, зависящие от С */
        [this._x, this._y] = cartesianFromPolar(this._c, this._h);

        return rgb.hex();
    }
}

export type ColorRoleConstraints = {
    l: number;
    cMax: number;
    isAccent?: boolean;
};

export type Theme<T extends string> = Record<T, ColorRoleConstraints>;
export type MockupColors<T extends string> = Record<T, Color>;

export type ThemeParams<T extends string, R extends string> = {
    themeKeys: readonly T[];
    roleKeys: readonly R[];
    themes: Record<T, Theme<R>>;
};

export type ColorMap = {
    totalQ: number;
    data: Map<string, Color>;
};

export type GenericColorRole = string;

export type ColorFormat = 'rgbHex' | 'hsb' | 'oklch';

export function getColorString(color: Color, format: ColorFormat) {
    switch (format) {
        case 'oklch':
            const { l, c, h } = color;
            return `oklch(${l.toFixed(0)}% ${(c / 100).toFixed(2)} ${h.toFixed(2)})`;
        case 'rgbHex':
        default:
            return color.adjustForRGB();
    }
}

export function getCssColors(colors: MockupColors<string>, format: ColorFormat) {
    return (
        Object.entries(colors)
            .map(([role, color]) => {
                const colorString = getColorString(color, format);
                return `  --${role}: ${colorString}`;
            })
            .join(';\n') + ';'
    );
}
