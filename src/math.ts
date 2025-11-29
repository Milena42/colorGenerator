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
export function hInRange(h: number, hRange: [number, number]) {
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
