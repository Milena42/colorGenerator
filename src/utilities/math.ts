import type { Color } from '../model/myTypes';

export function polarFromCartesian(x: number, y: number): [r: number, deg: number] {
    const r = Math.sqrt(x * x + y * y);
    const rad = Math.atan2(y, x);
    const deg = ((rad * 180) / Math.PI + 360) % 360;
    return [r, deg];
}

export function cartesianFromPolar(r: number, deg: number): [x: number, y: number] {
    const rad = (deg * Math.PI) / 180;
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return [x, y];
}

function hInRange(h: number, hRange: [number, number]) {
    const [hStart, hEnd] = hRange;
    if (hStart <= hEnd) {
        return hStart <= h && h <= hEnd;
    }
    return hStart <= h || h <= hEnd;
}

export function hMinus(h1: number, h2: number) {
    const dH = 180 - h2;
    const h = (h1 + dH + 360) % 360;
    return h - 180;
}

function hRangeOfMap(mapOfColors: Map<string, Color>) {
    const allH = Array.from(mapOfColors.values(), (v) => v.h).sort((a, b) => a - b);

    const first = allH[0];
    const last = allH[allH.length - 1];
    let maxGap = (first - last + 360) % 360;
    let maxGapRangeReversed: [number, number] = [first, last];

    for (let i = 1; i < allH.length; i++) {
        const d = (allH[i] - allH[i - 1]) % 360;
        if (d > maxGap) {
            maxGap = d;
            maxGapRangeReversed = [allH[i], allH[i - 1]];
        }
    }
    return maxGapRangeReversed;
}

function unitedMaps<T>(m1: Map<string, T>, m2: Map<string, T>) {
    return new Map(Array.from(m1).concat(Array.from(m2)));
}

function arrIsLargeEnough(arr: [string, Color][], enough: number) {
    if (arr.length == 0) return false;
    const q = arr.map(([, v]) => v.q).reduce((e1, e2) => e1 + e2);
    return q > enough;
}
