import { PolynomialRegression } from 'ml-regression';
import { Color, type MockupColors, type Theme } from './common';
import { polarFromCartesian } from './math';

function makeClustersNew(
    mapOfColors: Map<string, Color>,
):
    | { clusters: []; debugInfo: undefined }
    | { clusters: Map<string, Color>[]; debugInfo: ClusteringDebugInfo } {
    const filteredPoints = Array.from(mapOfColors);

    if (filteredPoints.length == 0) return { clusters: [], debugInfo: undefined };

    const points = filteredPoints.map(([, v]) => ({ h: v.h, q: v.q }));

    const circularHistogram: number[] = new Array(360).fill(0);
    points.forEach((point) => {
        const h = Math.round(point.h) % 360;
        circularHistogram[h] += point.q;
    });

    let previousArray: number[] = Array.from(circularHistogram);
    const smoothedCircularHistogram: number[] = new Array(360).fill(0);
    const smoothingRadius = 10;
    for (let k = 0; k < 3; k++) {
        for (let i = 0; i < 360; i++) {
            let sum = 0;
            for (let j = -smoothingRadius; j <= smoothingRadius; j++) {
                const index = (i + j + 360) % 360;
                sum += previousArray[index];
            }
            smoothedCircularHistogram[i] = sum / (2 * smoothingRadius);
        }
        previousArray = Array.from(smoothedCircularHistogram);
    }

    type Gap = { start: number; end: number; center: number };
    const gaps: Gap[] = [];
    let currentGapStart: number | undefined = undefined;
    const max = smoothedCircularHistogram.reduce((a, b) => Math.max(a, b), 0);
    const totalPixels = smoothedCircularHistogram.reduce((a, b) => a + b, 0);

    const minQForHistogram = 0.0025 * totalPixels * Math.pow((0.01 * totalPixels) / max, 3.15);

    smoothedCircularHistogram.forEach((value, h) => {
        if (currentGapStart != undefined) {
            if (value >= minQForHistogram) {
                const gap = {
                    start: currentGapStart,
                    end: h - 1,
                    center: (h - 1 - currentGapStart) / 2 + currentGapStart,
                };
                gaps.push(gap);
                currentGapStart = undefined;
            }
        } else if (value < minQForHistogram) {
            currentGapStart = h;
        }
    });

    if (currentGapStart != undefined) {
        if (gaps.length != 0 && gaps[0].start == 0) {
            const gap = {
                start: currentGapStart,
                end: gaps[0].end,
                center: ((360 + gaps[0].end - currentGapStart) / 2 + currentGapStart) % 360,
            };
            gaps[0] = gap;
        } else {
            const gap = {
                start: currentGapStart,
                end: 359,
                center: (359 - currentGapStart) / 2 + currentGapStart,
            };
            gaps.push(gap);
        }
    }

    let borders: number[];
    if (gaps.length == 0) {
        borders = [0, 120, 240];
    } else {
        borders = gaps.map((g) => g.center).sort((a, b) => a - b);
    }

    const clusters: Map<string, Color>[] = [];
    for (let i = 0; i < borders.length; i++) {
        clusters.push(new Map());
    }

    const numberOfClusters = clusters.length;
    filteredPoints.forEach(([k, v]) => {
        let i = 0;
        while (i < numberOfClusters) {
            if (v.h <= borders[i]) {
                break;
            }
            i++;
        }
        i %= numberOfClusters;

        clusters[i].set(k, v);
    });
    return {
        clusters,
        debugInfo: {
            borders,
            filteredPoints,
            circularHistogram,
            smoothedCircularHistogram,
            minQForHistogram,
        },
    };
}

function arraysForRegression(m: Map<string, Color>) {
    const lArray: number[] = [];
    const xArray: number[] = [];
    const yArray: number[] = [];
    const arr = Array.from(m.values(), (v) => ({ l: v.l, x: v.x, y: v.y, q: v.q }));
    arr.forEach(({ l, x, y, q }) => {
        for (let i = 0; i < q; i++) {
            lArray.push(l);
            xArray.push(x);
            yArray.push(y);
        }
    });
    return [lArray, xArray, yArray];
}

function regrFunction(mapOfColors: Map<string, Color>) {
    const [l, x, y] = arraysForRegression(mapOfColors);
    const xFromL = new PolynomialRegression(l, x, 2);
    const yFromL = new PolynomialRegression(l, y, 2);
    return { xFromL, yFromL };
}

function addBlack(map: Map<string, Color>) {
    map.set('#000000', new Color(0, { c: 0, h: 0 }));
    map.set('#010101', new Color(1, { c: 0, h: 0 }));
    map.set('#020202', new Color(2, { c: 0, h: 0 }));
}

function addWhite(map: Map<string, Color>) {
    map.set('#ffffff', new Color(100, { c: 0, h: 0 }));
    map.set('#fefefe', new Color(99, { c: 0, h: 0 }));
    map.set('#fdfdfd', new Color(98, { c: 0, h: 0 }));
}

type LRange = {
    start: number;
    end: number;
    function: {
        xFromL: PolynomialRegression;
        yFromL: PolynomialRegression;
    } | null;
};

function lInRange(l: number, lRange: LRange) {
    return lRange.start <= l && l <= lRange.end;
}

function getLFunction(l: number, lRanges: LRange[]) {
    const range = lRanges.find((r) => lInRange(l, r));
    if (!range) console.error('lRanges не покрывает весь диапазон');
    return range!.function!;
}

type ClusteringDebugInfo = {
    borders: number[];
    filteredPoints: [string, Color][];
    circularHistogram: number[];
    smoothedCircularHistogram: number[];
    minQForHistogram: number;
};
type GeneratorDebugInfo = {
    grays: Map<string, Color>;
    chromaTorus: Map<string, Color>;
    mapsClustered: Map<string, Color>[];
    clusteringDebug: ClusteringDebugInfo | undefined;
};

export class GeneratorFromPicture {
    lRanges: LRange[];

    debugInfo: GeneratorDebugInfo;

    private constructor(lRanges: LRange[], debugInfo: GeneratorDebugInfo) {
        this.lRanges = lRanges;
        this.debugInfo = debugInfo;
    }

    static async create(imgMap: Map<string, Color>, totalPixels: number) {
        const chromaLimit = 8;
        const sufficientNumber = 0.005 * totalPixels;
        //console.log("sN", sufficientNumber);

        const chromaTorus = new Map(Array.from(imgMap).filter(([, v]) => v.c > chromaLimit));
        const grays = new Map(Array.from(imgMap).filter(([, v]) => v.c < chromaLimit));

        addWhite(grays);
        addBlack(grays);

        const grayFunction = regrFunction(grays);
        const sectors: (typeof grayFunction)[] = [];

        let clusteringDebug;
        let mapsClustered: Map<string, Color>[];
        if (!chromaTorus.size) {
            // видимо, это нечто серое
            console.log('gray');
            mapsClustered = [];
            clusteringDebug = undefined;
        } else {
            const { clusters, debugInfo } = makeClustersNew(chromaTorus);
            clusteringDebug = debugInfo;
            mapsClustered = clusters;
            mapsClustered.forEach((mapOfColors) => {
                const newMap = new Map(mapOfColors);
                addBlack(newMap);
                addWhite(newMap);
                sectors.push(regrFunction(newMap));
            });
        }
        const lRanges: LRange[] = [
            {
                start: 0,
                end: 30,
                function: null,
            },
            {
                start: 30,
                end: 40,
                function: null,
            },
            {
                start: 40,
                end: 70,
                function: null,
            },
            {
                start: 70,
                end: 80,
                function: null,
            },
            {
                start: 80,
                end: 100,
                function: null,
            },
        ];

        lRanges.forEach((lRange) => {
            const { i } = mapsClustered.reduce(
                (best, currentMap, i) => {
                    const arr = Array.from(currentMap).filter(([, v]) => lInRange(v.l, lRange));
                    let q, c;
                    if (arr.length == 0) {
                        q = 0;
                        c = 0;
                    } else {
                        q = arr.map(([, v]) => v.q).reduce((e1, e2) => e1 + e2);
                        c = arr.map(([, v]) => v.c).reduce((a, b) => Math.max(a, b));
                    }

                    if (c > best.c && q + 0.1 * sufficientNumber > best.q) return { i, q, c };
                    return best;
                },
                { i: -1, q: sufficientNumber, c: 0 },
            );

            if (i == -1) {
                lRange.function = grayFunction;
            } else lRange.function = sectors[i];
        });

        return new GeneratorFromPicture(lRanges, {
            grays,
            chromaTorus,
            mapsClustered,
            clusteringDebug,
        });
    }

    generate<T extends string, R extends string>(
        themeKeys: readonly T[],
        roleKeys: readonly R[],
        themes: Record<T, Theme<R>>,
    ) {
        const generatedThemes: Record<T, MockupColors<R>> = Object.create(null);
        themeKeys.forEach((themeName) => {
            const themeRules = themes[themeName];

            const generatedTheme: MockupColors<R> = Object.create(null);
            roleKeys.forEach((roleName) => {
                const { l, cMax } = themeRules[roleName];

                const { xFromL, yFromL } = getLFunction(l, this.lRanges);
                const x = xFromL.predict(l);
                const y = yFromL.predict(l);

                const [cF, h] = polarFromCartesian(x, y);
                const c = Math.min(cF, cMax);

                const elem = new Color(l, { c, h });
                elem.adjustForRGB();

                generatedTheme[roleName] = elem;
            });

            generatedThemes[themeName] = generatedTheme;
        });
        return generatedThemes;
    }
}

/**
 * Создает и инициализирует объект генератора, выдает результат генерации.
 * При многоразовых генерациях по одному изображению рекомендуется вместо использования данной функции создать объект генератора и использовать повторно.
 */
export async function generateFromPictureOnce<T extends string, R extends string>(
    imgMap: Map<string, Color>,
    totalPixels: number,
    themeKeys: readonly T[],
    roleKeys: readonly R[],
    themes: Record<T, Theme<R>>,
) {
    const generator = await GeneratorFromPicture.create(imgMap, totalPixels);

    const generatedThemes = generator.generate(themeKeys, roleKeys, themes);

    return { generatedThemes, debugInfo: generator.debugInfo };
}
