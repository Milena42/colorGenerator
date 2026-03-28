<script setup lang="ts">
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import { Color, colorRoles, type MockupColors, type Theme } from '@/model/myTypes.ts';
import { darkTheme, lightTheme } from '@/model/themes.ts';
import ArrayOfPlots from '@/plots/ArrayOfPlots.vue';
import ColorModels3d from '@/plots/ColorModels3d.vue';
import PolarHistogram from '@/plots/PolarHistogram.vue';
import { polarFromCartesian } from '@/utilities/math.ts';
import chroma from 'chroma-js';
import { PolynomialRegression } from 'ml-regression';
import { inject, reactive, ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import DropBox from './DropBox.vue';

const userImg = ref<Uint8ClampedArray>();
let totalPixels = 1;
const imgMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
const debugMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
let imgMaxL: number; //TODO я зачем-то их замеряю, мб применить
let imgMinL: number;

function fillMapFromImg() {
    const newImgMap: Map<string, Color> = new Map();
    imgMaxL = 0;
    imgMinL = 100;
    if (!userImg.value) return newImgMap;
    totalPixels = userImg.value.length / 4;
    for (let i = 0; i < userImg.value.length; i += 4) {
        let r: number = userImg.value[i];
        let g: number = userImg.value[i + 1];
        let b: number = userImg.value[i + 2];

        /// TODO мб убрать, это режет цвета для скорости
        if (r <= 240) r = Math.round(r / 20) * 20;
        else r = 255;
        if (g <= 240) g = Math.round(g / 20) * 20;
        else g = 255;
        if (b <= 240) b = Math.round(b / 20) * 20;
        else b = 255;
        ////

        // TODO принимаю, что картинки только непрозрачные

        const rgb = chroma(r, g, b);
        const colorString = rgb.hex();
        let q;
        let elem: Color;
        if (!newImgMap.has(colorString)) {
            q = 1;
            let [l, c, h] = rgb.oklch();

            if (!l) l = 0;
            if (!c) c = 0;
            if (!h) h = 0;
            // потому что у меня в процентах, а не доля от 1
            l *= 100;
            c *= 100;

            elem = new Color(l, { c, h }, q);

            if (elem.l > imgMaxL) imgMaxL = elem.l;
            if (elem.l < imgMinL) imgMinL = elem.l;
            newImgMap.set(colorString, elem);
        } else {
            elem = newImgMap.get(colorString)!;
            elem.q += 1;
        }
    }
    return newImgMap;
}

const generatedDark: MockupColors = reactive({});
const generatedLight: MockupColors = reactive({});

const themes: [Theme, MockupColors][] = [
    [darkTheme, generatedDark],
    [lightTheme, generatedLight],
];

const mapsClustered: Ref<Map<string, Color>[]> = ref([]);
const minQToUsePoint = (0.01 * totalPixels) / 100;

const polarHistogramData1 = ref<number[]>([]);
const polarHistogramData2 = ref<number[]>([]);
const polarHistogramCircle = ref(0);
const polarHistogramBorders = ref<number[]>([]);

function makeClustersNew(mapOfColors: Map<string, Color>) {
    const filteredPoints = Array.from(mapOfColors).filter(([, v]) => v.q > minQToUsePoint);
    debugMap.value = new Map(filteredPoints);

    if (filteredPoints.length == 0) return [];

    const points = filteredPoints.map(([, v]) => ({ h: v.h, q: v.q }));

    const circularHistogram: number[] = new Array(360).fill(0);
    points.forEach((point) => {
        const h = Math.round(point.h) % 360;
        circularHistogram[h] += point.q;
    });
    polarHistogramData1.value = circularHistogram;

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
    polarHistogramData2.value = smoothedCircularHistogram;

    type Gap = { start: number; end: number; center: number };
    const gaps: Gap[] = [];
    let currentGapStart: number | undefined = undefined;
    const minQForHistogram = minQToUsePoint * 20000;
    polarHistogramCircle.value = minQForHistogram;

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
    polarHistogramBorders.value = borders;
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
    return clusters;
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

const graysMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());

function generateLRangeBased() {
    const chromaLimit = 8;

    const sufficientNumber = 0.005 * totalPixels;
    //console.log("sN", sufficientNumber);

    const chromaTorus = new Map(Array.from(imgMap.value).filter(([, v]) => v.c > chromaLimit));
    const grays = new Map(Array.from(imgMap.value).filter(([, v]) => v.c < chromaLimit));

    addWhite(grays);
    addBlack(grays);
    graysMap.value = grays;
    const grayFunction = regrFunction(grays);
    const sectors: (typeof grayFunction)[] = [];

    if (!chromaTorus.size) {
        // видимо, это нечто серое
        console.log('gray');
        mapsClustered.value = [];
    } else {
        mapsClustered.value = makeClustersNew(chromaTorus);
        mapsClustered.value.forEach((mapOfColors) => {
            const newMap = new Map(mapOfColors);
            addBlack(newMap);
            addWhite(newMap);
            sectors.push(regrFunction(newMap));
        });
    }

    lRanges.forEach((lRange) => {
        const { i } = mapsClustered.value.reduce(
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

    const newGeneratedMap: Map<string, Color> = new Map();

    themes.forEach(([themeRules, generatedTheme]) => {
        colorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];

            const { xFromL, yFromL } = getLFunction(l);
            const x = xFromL.predict(l);
            const y = yFromL.predict(l);

            const [cF, h] = polarFromCartesian(x, y);
            const c = Math.min(cF, cMax);

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = elem;
        });
    });

    return newGeneratedMap;
}

function generate() {
    imgMap.value = fillMapFromImg(); //TODO мб перенести это в dropbox чтобы не повторять при загрузке той же картинки
    generateLRangeBased();
}

const showPlots: Ref<boolean> = inject('showPlots') ?? ref(false);
</script>

<template>
    <div class="col">
        <div class="grow generator-picture-page-main">
            <DropBox v-model:pixels="userImg" @change="generate" />
            <MockupEditor
                class="grow"
                :colorsDark="generatedDark"
                :colorsLight="generatedLight"
                v-if="userImg"
            />
        </div>
        <div v-if="showPlots && userImg" class="col">
            <div class="row">
                <ColorModels3d :k="0.01" :data="imgMap" :totalQ="totalPixels" wireframe />
                <ColorModels3d
                    :k="0.01"
                    :data="debugMap"
                    :totalQ="totalPixels"
                    style="border: 1px solid red"
                    wireframe
                />
            </div>
            <div class="row">
                <PolarHistogram
                    :data="polarHistogramData1"
                    :circle="polarHistogramCircle"
                    :borders="polarHistogramBorders"
                />
                <PolarHistogram
                    :data="polarHistogramData2"
                    :circle="polarHistogramCircle"
                    :borders="polarHistogramBorders"
                />
            </div>
            <ArrayOfPlots :maps="mapsClustered" :totalQ="totalPixels" />
            <div class="row">
                <ColorModels3d :k="0.01" :data="graysMap" :totalQ="totalPixels" wireframe />
            </div>
        </div>
    </div>
</template>

<style scoped>
.generator-picture-page-main {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-evenly;
    gap: 1rem;

    .dropbox {
        flex: 5 1 0;
        align-self: stretch;
    }
}
</style>
