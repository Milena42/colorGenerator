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
import { cartesianFromPolar, hInRange, polarFromCartesian } from './math';
import { Color, accentColorRoles, bgColorRoles, colorRoles, type MockupColors, type Theme } from './myTypes';
import { newDarkTheme, newLightTheme } from './themes.ts';

const userImg = ref<Uint8ClampedArray>();
let totalPixels = 1;
const imgMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
const debugMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
const generatedMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());
let imgMaxL: number;
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
function makeClusters(mapOfColors: Map<string, Color>, numberOfClusters: number) {
    //const coords = Array.from(mapOfColors.values(), (v) => [v.x, v.y]);
    const coords = Array.from(mapOfColors.values(), (v) => cartesianFromPolar(1, v.h));

    const clusterIndexesForPoints = kmeans(coords, numberOfClusters, { initialization: "mostDistant" }).clusters;
    const clusters: Map<string, Color>[] = [];
    for (let i = 0; i < numberOfClusters; i++) {
        clusters.push(new Map());
    }

    let i = 0;
    mapOfColors.forEach((v, k) => {
        const cluster = clusterIndexesForPoints[i];
        clusters[cluster].set(k, v);
        i++;
    });
    return clusters;
}
function makeClustersUnknownNumber(mapOfColors: Map<string, Color>) {
    //TODO мб kmeans
    // попробовать делить широкие кластеры в зависимости от диапазона h
    if (mapOfColors.size == 1) return [mapOfColors];

    const minQToUsePoint = 0.01 * totalPixels / 100;

    const filteredPoints = Array.from(mapOfColors).filter(([k, v]) => (v.q > minQToUsePoint));
    debugMap.value = new Map(filteredPoints);
    const initialKeys = filteredPoints.map(([k, v]) => k);
    const coords = filteredPoints.map(([k, v]) => cartesianFromPolar(v.c, v.h));

    const dbscan = new clustering.DBSCAN();
    const pointsInClusters = dbscan.run(coords, 3, 2);

    const clusters = pointsInClusters.map((indexesInCluster) => {
        const clusterMap: Map<string, Color> = new Map();
        indexesInCluster.forEach((i) => {
            clusterMap.set(initialKeys[i], mapOfColors.get(initialKeys[i])!);
        });
        return clusterMap;
    });
    return clusters;
}

function generateClusteredSimple() {

    //const coords = Array.from(imgMap.value.values(), (v) => [v.x, v.y]);
    const coords = Array.from(imgMap.value.values(), (v) => cartesianFromPolar(1, v.h));


    const numberOfClusters = 4;
    const clusterIndexesForPoints = kmeans(coords, numberOfClusters, { initialization: "mostDistant" }).clusters;
    mapsClustered.value = [];
    for (let i = 0; i < numberOfClusters; i++) {
        mapsClustered.value.push(new Map());
    }
    let i = 0;
    imgMap.value.forEach((v, k) => {
        const cluster = clusterIndexesForPoints[i];
        mapsClustered.value[cluster].set(k, v);
        i++;
    });


    /*
        const dbscan = new clustering.DBSCAN();
        const clusters = dbscan.run(coords, 1, 2);
        const initialKeys = Array.from(imgMap.value.keys());
        mapsClustered.value = clusters.map((indexesInCluster) => {
            const clusterMap: Map<string, Color> = new Map();
            indexesInCluster.forEach((i) => {
                clusterMap.set(initialKeys[i], imgMap.value.get(initialKeys[i])!);
            })
            return clusterMap;
        })
    */

    const clustersMaxChromas = mapsClustered.value.map((map: Map<string, Color>) =>
        Math.max(...Array.from(map.values(), (v) => v.c))
    );
    const maxChroma = Math.max(...clustersMaxChromas);

    const clustersLRanges = mapsClustered.value.map((map: Map<string, Color>) => {
        const l = Array.from(map.values(), (v) => v.l);
        return Math.max(...l) - Math.min(...l);
    }
    );
    const maxLRange = Math.max(...clustersLRanges);


    const newGeneratedMap: Map<string, Color> = new Map();

    for (const i in mapsClustered.value) {//TODO сделано только для 2 кластеров
        const map: Map<string, Color> = mapsClustered.value[i];
        const l = Array.from(map.values(), (v) => v.l);
        const x = Array.from(map.values(), (v) => v.x);
        const y = Array.from(map.values(), (v) => v.y);
        const xFromL = new PolynomialRegression(l, x, 2);
        const yFromL = new PolynomialRegression(l, y, 2);

        let currentColorRoles = bgColorRoles;

        if (clustersLRanges[i] != maxLRange) {
            if (clustersMaxChromas[i] == maxChroma) {
                currentColorRoles = accentColorRoles;
            } else continue;
        } else {
            if (clustersMaxChromas[i] == maxChroma) {
                currentColorRoles = colorRoles;
            }
            else currentColorRoles = bgColorRoles;
        }

        themes.forEach(([themeRules, generatedTheme]) => {
            currentColorRoles.forEach((key) => {
                const { l, cMax } = themeRules[key];

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
    }

    return newGeneratedMap;
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

enum LRange { light, middle, dark, all, lightMiddle, darkMiddle };
function lInLRange(l: number, lRange: LRange) {
    switch (lRange) {
        case LRange.light:
            return (70 <= l);
        case LRange.middle:
            return (30 <= l && l <= 70);
        case LRange.dark:
            return (l <= 30);
        case LRange.lightMiddle:
            return (30 <= l);
        case LRange.darkMiddle:
            return (l <= 70);
        case LRange.all:
            return true;
    }
}

function generateRegressionFromMap(mapOfColors: Map<string, Color>, roles: string, lRange = LRange.all) {

    let currentColorRoles = colorRoles;
    switch (roles) {
        case "accent":
            currentColorRoles = accentColorRoles;
            break;
        case "bg":
            currentColorRoles = bgColorRoles;
            break;
        default:
            break;
    }

    const newGeneratedMap: Map<string, Color> = new Map();

    //console.log(mapOfColors);
    if (mapOfColors.size == 0) {
        console.log("empty map");
        return newGeneratedMap;
    }
    if (mapOfColors.size == 1) {
        themes.forEach(([themeRules, generatedTheme]) => {
            currentColorRoles.forEach((key) => {
                const { l, cMax } = themeRules[key];
                if (lInLRange(l, lRange)) {
                    let { c, h } = Array.from(mapOfColors)[0][1];
                    if (c > cMax) c = cMax;

                    const elem = new Color(l, { c, h });
                    const rgbString = elem.adjustForRGB();

                    newGeneratedMap.set(rgbString, elem);

                    generatedTheme[key] = rgbString;
                }
            });
        });
        return newGeneratedMap;
    }

    const { xFromL, yFromL } = regrFunction(mapOfColors);

    themes.forEach(([themeRules, generatedTheme]) => {
        currentColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];
            if (lInLRange(l, lRange)) {
                const x = xFromL.predict(l);
                const y = yFromL.predict(l);
                let [c, h] = polarFromCartesian(x, y);
                if (c > cMax) c = cMax;

                const elem = new Color(l, { c, h });
                const rgbString = elem.adjustForRGB();

                newGeneratedMap.set(rgbString, elem);

                generatedTheme[key] = rgbString;
            }
        });
    });
    return newGeneratedMap;
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

function generateLogical() {

    const chromaLimit = 8;
    const upperLimit = 70;
    const lowerLimit = 40;
    const sufficientNumber = 0.01 * totalPixels;



    const upperCylinderContainsChroma = arrIsLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l > upperLimit && v.c > 0.5)), sufficientNumber);
    const lowerCylinderContainsChroma = arrIsLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l < lowerLimit && v.c > 0.5)), sufficientNumber);
    const theresALotOfGray = arrIsLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l > 30 && v.l < 80 && v.c < chromaLimit)), 0.2 * totalPixels);
    const centralChromaTorus = new Map(Array.from(imgMap.value).filter(([k, v]) => (v.c > chromaLimit)));

    //debugMap.value = centralChromaTorus;

    if (!centralChromaTorus.size) {
        // видимо, это нечто серое
        console.log("gray");

        const newMap = new Map(imgMap.value);
        if (!upperCylinderContainsChroma) {
            addWhite(newMap);
        }

        if (!lowerCylinderContainsChroma) {
            addBlack(newMap);
        }

        return generateRegressionFromMap(newMap, "all");
    }


    //это будет новая кластеризация бублика для определения типа темы
    // или мб можно 1 2 3 и сравнить метрики

    mapsClustered.value = makeClustersUnknownNumber(centralChromaTorus);
    const numberOfAccents = mapsClustered.value.length;


    if (numberOfAccents == 1) {
        //это монохром или аналоговая, норм регрессией по всем
        console.log("mono");


        if (upperCylinderContainsChroma && lowerCylinderContainsChroma && !theresALotOfGray) {
            // не придумываем цвета, они были изначально
            console.log("simple regr");
            const notGray = new Map(Array.from(imgMap.value).filter(([k, v]) => !(v.l > 30 && v.l < 80 && v.c < chromaLimit)));
            return generateRegressionFromMap(notGray, "all");
        }

        // решаем проблему желтого квадрата и золотого картона:
        console.log("golden fixed");

        let newGeneratedMap = generateRegressionFromMap(centralChromaTorus, "accent");

        //const accentHRange = hRangeOfMap(centralChromaTorus);

        const accentH = newGeneratedMap.get(themes[0][1].accentLarge)!.h;

        const accentHRange: [number, number] = [(accentH - 30 + 360) % 360, (accentH + 30) % 360];

        const otherPart = new Map(Array.from(imgMap.value).filter(([k, v]) => !hInRange(v.h, accentHRange)));

        //debugMap.value = centralChromaTorus;

        if (!upperCylinderContainsChroma) {//TODO надо отдельно мб проверять оставшееся, потому что желтый очень светлый и в итоге точек нет, падает регрессия
            addWhite(otherPart);
        }

        if (!lowerCylinderContainsChroma) {
            addBlack(otherPart);
        }

        newGeneratedMap = unitedMaps(newGeneratedMap, generateRegressionFromMap(otherPart, "bg"));
        return newGeneratedMap;
    }

    //кластеризация бублика

    if (numberOfAccents == 2) {
        // комплементарная
        console.log("complementary");

        //TODO? считаю по максимальной насыщенности, мб надо по средней
        const [c0, c1] = mapsClustered.value.map((map: Map<string, Color>) =>
            Math.max(...Array.from(map.values(), (v) => v.c))
        );
        let accentMap;
        if (c0 > c1) accentMap = mapsClustered.value[0];
        else accentMap = mapsClustered.value[1];

        let newGeneratedMap = generateRegressionFromMap(accentMap, "accent");

        const accentHRange = hRangeOfMap(accentMap);

        const otherPart = new Map(Array.from(imgMap.value).filter(([k, v]) => !hInRange(v.h, accentHRange)));//TODO? мб убрать второй акцент оттуда тоже
        if (!upperCylinderContainsChroma) {
            addWhite(otherPart);
        }

        if (!lowerCylinderContainsChroma) {
            addBlack(otherPart);
        }

        newGeneratedMap = unitedMaps(newGeneratedMap, generateRegressionFromMap(otherPart, "bg"));
        return newGeneratedMap;
    }

    // триада, больше 3 я не рассматриваю
    console.log("triadic");

    //TODO

    const newGeneratedMap: Map<string, Color> = new Map();
    return newGeneratedMap;

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
    //console.log(chromaTorus);
    //console.log(sectors);
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
            //console.log("q", q);
            //console.log(lRange);
            if (c > best.c && (q + 0.1 * sufficientNumber) > best.q)
                return { i, q, c };
            return best;
        },
            { i: -1, q: sufficientNumber, c: 0 }
        );
        if (i == -1) {
            lRange.function = grayFunction;
        } else lRange.function = sectors[i];
        //console.log("i", i);
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

    //generateRegressionSimple();

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