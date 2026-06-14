import { PolynomialRegression } from 'ml-regression';
import { Color, type ThemeParams } from './common';
import { polarFromCartesian } from './math';

function makeClusters(
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

function regression(mapOfColors: Map<string, Color>) {
    const [l, x, y] = arraysForRegression(mapOfColors);
    //////////////
    /// Это потому что регрессии надо минимум 3 точки
    l.push(0, 0.5, 100);
    x.push(0, 0, 0);
    y.push(0, 0, 0);
    ///////////
    const xFromL = new PolynomialRegression(l, x, 2);
    const yFromL = new PolynomialRegression(l, y, 2);
    return { xFromL, yFromL };
}

type LRange = {
    min: number;
    max: number;
};

function lInRange(l: number, lRange: LRange) {
    return lRange.min <= l && l <= lRange.max;
}

function rangesOverlap(a: LRange, b: LRange) {
    return b.min <= a.max && a.min <= b.max;
}

class Cluster {
    id: string;
    colors: Map<string, Color>;
    lRange: LRange;

    private regression: {
        xFromL: PolynomialRegression;
        yFromL: PolynomialRegression;
    };

    chFromL(l: number) {
        const x = this.regression.xFromL.predict(l);
        const y = this.regression.yFromL.predict(l);
        const [c, h] = polarFromCartesian(x, y);
        return [c, h];
    }

    constructor(mapOfColors: Map<string, Color>, id: string) {
        this.id = id;
        this.regression = regression(mapOfColors);
        this.colors = mapOfColors;
        const arr = Array.from(mapOfColors);
        this.lRange = arr
            .map(([, { l }]) => l)
            .reduce(
                (m, current) => ({
                    min: Math.min(m.min, current),
                    max: Math.max(m.max, current),
                }),
                { min: 200, max: -100 },
            );
    }
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

type LRangeCluster = { lRange: LRange; clusterId: string | null };

export class GeneratorFromPicture {
    clusters: Cluster[];
    lRangeClusters: LRangeCluster[];

    debugInfo: GeneratorDebugInfo;

    private constructor(
        clusters: Cluster[],
        lRangeClusters: LRangeCluster[],
        debugInfo: GeneratorDebugInfo,
    ) {
        this.clusters = clusters;
        this.lRangeClusters = lRangeClusters;
        this.debugInfo = debugInfo;
    }

    static async create(imgMap: Map<string, Color>, totalPixels: number) {
        const chromaLimit = 8;

        const chromaTorus = new Map(Array.from(imgMap).filter(([, v]) => v.c > chromaLimit));
        const lowChroma = new Map(Array.from(imgMap).filter(([, v]) => v.c < chromaLimit));

        const allClusters: Cluster[] = [];

        let clusteringDebug;
        let mapsClustered: Map<string, Color>[];
        if (!chromaTorus.size) {
            mapsClustered = [];
            clusteringDebug = undefined;
        } else {
            const { clusters, debugInfo } = makeClusters(chromaTorus);
            clusteringDebug = debugInfo;
            mapsClustered = clusters;
            mapsClustered.forEach((mapOfColors, i) => {
                allClusters.push(new Cluster(mapOfColors, 'c' + i));
            });
        }

        const lRangeClusters: LRangeCluster[] = [
            {
                lRange: {
                    min: 0,
                    max: 30,
                },
                clusterId: null,
            },
            {
                lRange: {
                    min: 30,
                    max: 40,
                },
                clusterId: null,
            },
            {
                lRange: {
                    min: 40,
                    max: 70,
                },
                clusterId: null,
            },
            {
                lRange: {
                    min: 70,
                    max: 80,
                },
                clusterId: null,
            },
            {
                lRange: {
                    min: 80,
                    max: 100,
                },
                clusterId: null,
            },
        ];

        const LOW_CHROMA = 'lowChroma';
        const sufficientNumber = 0.005 * totalPixels;

        lRangeClusters.forEach((lRangeCluster) => {
            const { id } = allClusters.reduce(
                (best, cluster) => {
                    const arr = Array.from(cluster.colors).filter(([, v]) =>
                        lInRange(v.l, lRangeCluster.lRange),
                    );
                    let q, c;
                    if (arr.length == 0) {
                        q = 0;
                        c = 0;
                    } else {
                        q = arr.map(([, v]) => v.q).reduce((e1, e2) => e1 + e2);
                        c = arr.map(([, v]) => v.c).reduce((a, b) => Math.max(a, b));
                    }

                    if (c > best.c && q + 0.1 * sufficientNumber > best.q)
                        return { id: cluster.id, q, c };
                    return best;
                },
                { id: '', q: sufficientNumber, c: 0 },
            );

            if (id == '') {
                if (
                    Array.from(lowChroma).filter(([, v]) => lInRange(v.l, lRangeCluster.lRange))
                        .length
                ) {
                    lRangeCluster.clusterId = LOW_CHROMA;
                } else {
                    lRangeCluster.clusterId = null;
                }
            } else lRangeCluster.clusterId = id;
        });

        if (lowChroma.size) allClusters.push(new Cluster(lowChroma, LOW_CHROMA)); //добавляется последним, чтобы не участвовал в цикле

        return new GeneratorFromPicture(allClusters, lRangeClusters, {
            grays: lowChroma,
            chromaTorus,
            mapsClustered,
            clusteringDebug,
        });
    }

    generate<T extends string, R extends string>(themeParams: ThemeParams<T, R>) {
        const { themeKeys, roleKeys, themes } = themeParams;

        const generatedThemes: Record<
            T,
            { variants: GeneratedVariants<R>; chosen: ChosenVariants<R> }
        > = Object.create(null);

        themeKeys.forEach((themeName) => {
            const themeRules = themes[themeName];

            generatedThemes[themeName] = {
                variants: Object.create(null),
                chosen: Object.create(null),
            };

            roleKeys.forEach((roleName) => {
                const { l, cMax, isAccent } = themeRules[roleName];

                const variants: Record<string, Color> = Object.create(null);

                //кластеры с изображения:
                this.clusters.forEach((cluster) => {
                    const [cF, h] = cluster.chFromL(l);
                    const c = Math.min(cF, cMax);

                    const elem = new Color(l, { c, h });
                    elem.adjustForRGB();

                    variants[cluster.id] = elem;
                });

                //абсолютно серый:
                const ZERO_CHROMA = 'zeroChroma';
                const elem = new Color(l, { c: 0, h: 0 });
                elem.adjustForRGB();
                variants[ZERO_CHROMA] = elem;

                generatedThemes[themeName].variants[roleName] = variants;

                //выбор:
                const range = this.lRangeClusters.find((r) => lInRange(l, r.lRange))?.clusterId;
                if (!range && isAccent) {
                    const almostSameL = 8;
                    const clusters = this.clusters
                        .filter((c) =>
                            rangesOverlap({ min: l - almostSameL, max: l + almostSameL }, c.lRange),
                        )
                        .map((c) => c.id);
                    const n = Object.entries(variants)
                        .filter(([id]) => clusters.includes(id))
                        .reduce(
                            (best, [id, color]) => {
                                return color.c > best.c ? { c: color.c, id } : best;
                            },
                            { c: 0, id: ZERO_CHROMA },
                        );
                    generatedThemes[themeName].chosen[roleName] = n.id;
                } else {
                    generatedThemes[themeName].chosen[roleName] = range ?? ZERO_CHROMA;
                }
            });
        });
        return generatedThemes;
    }
}

export type GeneratedThemes<T extends string, R extends string> = Record<T, GeneratedTheme<R>>;
export type GeneratedTheme<R extends string> = {
    variants: GeneratedVariants<R>;
    chosen: ChosenVariants<R>;
};
export type GeneratedVariants<R extends string> = Record<R, Record<string, Color>>;
export type ChosenVariants<R extends string> = Record<R, string>;

/**
 * Создает и инициализирует объект генератора, выдает результат генерации.
 * При многоразовых генерациях по одному изображению рекомендуется вместо использования данной функции создать объект генератора и использовать повторно.
 */
export async function generateFromPictureOnce<T extends string, R extends string>(
    imgMap: Map<string, Color>,
    totalPixels: number,
    themeParams: ThemeParams<T, R>,
) {
    const generator = await GeneratorFromPicture.create(imgMap, totalPixels);

    const generatedThemes = generator.generate(themeParams);

    return { generatedThemes, debugInfo: generator.debugInfo };
}
