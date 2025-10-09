export function polarFromCartesian(x: number, y: number): [r: number, deg: number] {
    const r = Math.sqrt(x * x + y * y);
    const rad = Math.atan2(y, x);
    const deg = (rad * 180) / Math.PI;
    return [r, deg];
}

export function cartesianFromPolar(r: number, deg: number): [x: number, y: number] {
    const rad = (deg * Math.PI) / 180;
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return [x, y];
}
