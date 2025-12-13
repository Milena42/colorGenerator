<script setup lang="ts">
import chroma from 'chroma-js';
import clustering from "density-clustering";
import { kmeans } from 'ml-kmeans';
import { PolynomialRegression } from 'ml-regression';
import { reactive, ref, shallowRef, watch, type Ref, type ShallowRef } from 'vue';
import ArrayOfPlots from './ArrayOfPlots.vue';
import DropBox from './DropBox.vue';
import MapPlot3d from './MapPlot3d.vue';
import MockUp from './MockUp.vue';
import { cartesianFromPolar, polarFromCartesian } from './math';
import { Color, colorRoles, type MockupColors, type Theme } from './myTypes';
import { newDarkTheme, newLightTheme } from './themes.ts';

const userImg = ref<Uint8ClampedArray>();
let totalPixels = 1;
const imgMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
const debugMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
const generatedMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
let imgMaxL: number;//TODO я зачем-то их замеряю, мб применить
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
        }
        else {
            elem = newImgMap.get(colorString)!;
            elem.q += 1;
        }


    }
    return newImgMap;
}

const generatedDark: MockupColors = reactive({});
const generatedLight: MockupColors = reactive({});

const themes: [Theme, MockupColors][] = [
    [newDarkTheme, generatedDark],
    [newLightTheme, generatedLight],
];


const mapsClustered: Ref<Map<string, Color>[]> = ref([]);
const minQToUsePoint = 0.01 * totalPixels / 100;

function makeClusters(mapOfColors: Map<string, Color>, numberOfClusters = 3) {

    const filteredPoints = Array.from(mapOfColors).filter(([k, v]) => (v.q > minQToUsePoint));
    debugMap.value = new Map(filteredPoints);
    const coords = filteredPoints.map(([k, v]) => cartesianFromPolar(1, v.h));

    const clusterIndexesForPoints = kmeans(coords, numberOfClusters, { initialization: "mostDistant" }).clusters;


    const clusters: Map<string, Color>[] = [];
    for (let i = 0; i < numberOfClusters; i++) {
        clusters.push(new Map());
    }
    filteredPoints.forEach(([k, v], i) => {
        const cluster = clusterIndexesForPoints[i];
        clusters[cluster].set(k, v);
    });
    return clusters;
}

function makeClustersUnknownNumber(mapOfColors: Map<string, Color>) {

    const filteredPoints = Array.from(mapOfColors).filter(([k, v]) => (v.q > minQToUsePoint));
    debugMap.value = new Map(filteredPoints);
    const initialKeys = filteredPoints.map(([k, v]) => k);
    const coords = filteredPoints.map(([k, v]) => cartesianFromPolar(v.c, v.h));

    const dbscan = new clustering.DBSCAN();
    const pointsInClusters = dbscan.run(coords, 5, 1);

    const clusters = pointsInClusters.map((indexesInCluster) => {
        const clusterMap: Map<string, Color> = new Map();
        indexesInCluster.forEach((i) => {
            clusterMap.set(initialKeys[i], mapOfColors.get(initialKeys[i])!);
        });
        return clusterMap;
    });
    return clusters;
}


function arraysForRegression(m: Map<string, Color>) {
    const lArray: number[] = [];
    const xArray: number[] = [];
    const yArray: number[] = [];
    const arr = Array.from(m.values(), (v, k) => ({ l: v.l, x: v.x, y: v.y, q: v.q }));
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


function hRangeOfMap(mapOfColors: Map<string, Color>) {
    const allH = Array.from(mapOfColors.values(), (v) => v.h).sort((a, b) => (a - b));

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

function addBlack(map: Map<string, Color>) {
    map.set("#000000", new Color(0, { c: 0, h: 0 }));
    map.set("#010101", new Color(1, { c: 0, h: 0 }));
    map.set("#020202", new Color(2, { c: 0, h: 0 }));
}
function addWhite(map: Map<string, Color>) {
    map.set("#ffffff", new Color(100, { c: 0, h: 0 }));
    map.set("#fefefe", new Color(99, { c: 0, h: 0 }));
    map.set("#fdfdfd", new Color(98, { c: 0, h: 0 }));
}

function arrIsLargeEnough(arr: [string, Color][], enough: number) {
    if (arr.length == 0) return false;
    const q = arr.map(([k, v]) => v.q).reduce((e1, e2) => (e1 + e2));
    return q > enough;
}

type rangeL = {
    start: number,
    end: number,
    function: {
        xFromL: PolynomialRegression;
        yFromL: PolynomialRegression;
    } | null;
};

const lRanges: rangeL[] = [
    {
        start: 0,
        end: 30,
        function: null
    },
    {
        start: 30,
        end: 40,
        function: null
    },
    {
        start: 40,
        end: 70,
        function: null
    },
    {
        start: 70,
        end: 80,
        function: null
    },
    {
        start: 80,
        end: 100,
        function: null
    },
];

function lInRange(l: number, lRange: typeof lRanges[0]) {
    return (lRange.start <= l && l <= lRange.end);
}

function getLFunction(l: number) {
    const range = lRanges.find((r) => (lInRange(l, r)));
    if (!range) console.error("lRanges не покрывает весь диапазон");
    return range!.function!;
}

function generateLRangeBased() {

    const chromaLimit = 8;

    const sufficientNumber = 0.005 * totalPixels;
    //console.log("sN", sufficientNumber);

    const chromaTorus = new Map(Array.from(imgMap.value).filter(([k, v]) => (v.c > chromaLimit)));
    const grays = new Map(Array.from(imgMap.value).filter(([k, v]) => (v.c < chromaLimit)));

    addWhite(grays);
    addBlack(grays);
    const grayFunction = regrFunction(grays);
    const sectors: typeof grayFunction[] = [];

    if (!chromaTorus.size) {
        // видимо, это нечто серое
        console.log("gray");
        mapsClustered.value = [];
    } else {
        mapsClustered.value = makeClustersUnknownNumber(chromaTorus);
        mapsClustered.value.forEach((mapOfColors) => {
            const newMap = new Map(mapOfColors);
            addBlack(newMap);
            addWhite(newMap);
            sectors.push(regrFunction(newMap));
        });
    }

    lRanges.forEach((lRange) => {
        const { i } = mapsClustered.value.reduce((best, currentMap, i) => {

            const arr = Array.from(currentMap).filter(([k, v]) => lInRange(v.l, lRange));
            let q, c;
            if (arr.length == 0) {
                q = 0;
                c = 0;
            }
            else {
                q = arr.map(([k, v]) => v.q).reduce((e1, e2) => (e1 + e2));
                c = Math.max(...arr.map(([k, v]) => v.c));
            }

            if (c > best.c && (q + 0.1 * sufficientNumber) > best.q)
                return { i, q, c };
            return best;
        },
            { i: -1, q: sufficientNumber, c: 0 }
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

            let [c, h] = polarFromCartesian(x, y);
            if (c > cMax) c = cMax;

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
    });

    return newGeneratedMap;
}

watch(userImg, () => {
    imgMap.value = fillMapFromImg();
    generatedMap.value = generateLRangeBased();
});

</script>
<template>
    <div>
        <div class="row userUpload">
            <DropBox v-model:pixels="userImg">Загрузите изображение сюда
            </DropBox>
            <MapPlot3d :k="500" :data="imgMap" :totalQ="totalPixels" />
            <MapPlot3d :k="500" :data="debugMap" :totalQ="totalPixels" style="border: 1px solid red;" />
        </div>
        <ArrayOfPlots :maps="mapsClustered" :totalQ="totalPixels" />
        <div class="m1">
            <MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" />
            <div>
                <MockUp :colorsDark="generatedDark" :colorsLight="generatedLight" />
            </div>
        </div>
    </div>
</template>