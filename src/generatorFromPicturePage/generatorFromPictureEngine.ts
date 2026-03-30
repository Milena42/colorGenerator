import { Color, colorRoles, type MockupColors, type Theme } from '@/model/myTypes';
import { polarFromCartesian } from '@/utilities/math';
import { PolynomialRegression } from 'ml-regression';

function makeClustersNew(mapOfColors: Map<string, Color>, totalPixels: number) {
    const minQToUsePoint = (0.01 * totalPixels) / 100;
    const filteredPoints = Array.from(mapOfColors).filter(([, v]) => v.q > minQToUsePoint);

    if (filteredPoints.length == 0) return { clusters: [], debugInfo: {} };

    const points = filteredPoints.map(([, v]) => ({ h: v.h, q: v.q }));

    const circularHistogram: number[] = new Array(360).fill(0);
    points.forEach((point) => {
        const h = Math.round(point.h) % 360;
        circularHistogram[h] += point.q;
    });

    const smoothedCircularHistogram: number[] = new Array(360).fill(0);
    const smoothingRadius = 10;
    for (let i = 0; i < 360; i++) {
        let sum = 0;
        for (let j = -smoothingRadius; j <= smoothingRadius; j++) {
            const index = (i + j + 360) % 360;
            sum += circularHistogram[index];
        }
        smoothedCircularHistogram[i] = sum / (2 * smoothingRadius);
    }

    type Gap = { start: number; end: number; center: number };
    const gaps: Gap[] = [];
    let currentGapStart: number | undefined = undefined;
    const minQForHistogram = minQToUsePoint * 22900; //TODO настроить кластеризацию

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

type rangeL = {
    start: number;
    end: number;
    function: {
        xFromL: PolynomialRegression;
        yFromL: PolynomialRegression;
    } | null;
};

const lRanges: rangeL[] = [
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

function lInRange(l: number, lRange: (typeof lRanges)[0]) {
    return lRange.start <= l && l <= lRange.end;
}

function getLFunction(l: number) {
    const range = lRanges.find((r) => lInRange(l, r));
    if (!range) console.error('lRanges не покрывает весь диапазон');
    return range!.function!;
}

export function generateLRangeBased(
    imgMap: Map<string, Color>,
    totalPixels: number,
    themes: Map<string, Theme>,
) {
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
        clusteringDebug = {};
    } else {
        const { clusters, debugInfo } = makeClustersNew(chromaTorus, totalPixels);
        clusteringDebug = debugInfo;
        mapsClustered = clusters;
        mapsClustered.forEach((mapOfColors) => {
            const newMap = new Map(mapOfColors);
            addBlack(newMap);
            addWhite(newMap);
            sectors.push(regrFunction(newMap));
        });
    }

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

    const generatedThemes = new Map<string, MockupColors>();

    themes.forEach((themeRules, name) => {
        const generatedTheme: MockupColors = {};
        colorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];

            const { xFromL, yFromL } = getLFunction(l);
            const x = xFromL.predict(l);
            const y = yFromL.predict(l);

            const [cF, h] = polarFromCartesian(x, y);
            const c = Math.min(cF, cMax);

            const elem = new Color(l, { c, h });
            elem.adjustForRGB();

            generatedTheme[key] = elem;
        });
        generatedThemes.set(name, generatedTheme);
    });

    return { generatedThemes, debugInfo: { grays, chromaTorus, mapsClustered, clusteringDebug } };
}
