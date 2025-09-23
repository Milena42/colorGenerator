export function polarFromCartesian(x: number, y: number) {
    let r = Math.sqrt(x * x + y * y);
    let rad = Math.atan2(y, x);
    let deg = (rad * 180) / Math.PI;
    return [r, deg];
}

export function cartesianFromPolar(r: number, deg: number): [number, number] {
    let rad = (deg * Math.PI) / 180;
    let x = r * Math.cos(rad);
    let y = r * Math.sin(rad);
    return [x, y];
}
