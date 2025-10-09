<script setup lang="ts">
import chroma from 'chroma-js';
import clustering from "density-clustering";
import { kmeans } from 'ml-kmeans';
import { PolynomialRegression } from 'ml-regression';
import { reactive, ref, watch } from 'vue';
import ArrayOfPlots from './ArrayOfPlots.vue';
import DropBox from './DropBox.vue';
import MapPlot3d from './MapPlot3d.vue';
import MockUp from './MockUp.vue';
import { cartesianFromPolar, polarFromCartesian } from './math';
import { Color, accentColorRoles, bgColorRoles, colorRoles, type MockupColors, type Theme } from './myTypes';
import { darkTheme, darkThemeHighContrast, lightTheme, lightThemeHighContrast } from './themes.ts';

const userImg = ref<Uint8ClampedArray>();
let totalPixels = 1;
const imgMap = ref<Map<string, Color>>(new Map());
const debugMap = ref<Map<string, Color>>(new Map());
const generatedMap = ref<Map<string, Color>>(new Map());
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
const generatedLightHighContrast: MockupColors = reactive({});
const generatedDarkHighContrast: MockupColors = reactive({});

const themes: [Theme, MockupColors][] = [
    [darkTheme, generatedDark],
    [lightTheme, generatedLight],
    [lightThemeHighContrast, generatedLightHighContrast],
    [darkThemeHighContrast, generatedDarkHighContrast],
];


const mapsClustered = ref([new Map()]);
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

function generateRegressionFromMap(mapOfColors: Map<string, Color>, roles: string) {

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

                let { c, h } = Array.from(mapOfColors)[0][1];
                if (c > cMax) c = cMax;

                const elem = new Color(l, { c, h });
                const rgbString = elem.adjustForRGB();

                newGeneratedMap.set(rgbString, elem);

                generatedTheme[key] = rgbString;
            });
        });
        return newGeneratedMap;
    }

    const [l, x, y] = arraysForRegression(mapOfColors);
    const xFromL = new PolynomialRegression(l, x, 2);
    const yFromL = new PolynomialRegression(l, y, 2);

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
    return newGeneratedMap;
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
function hInRange(h: number, hRange: [number, number]) {
    const [hStart, hEnd] = hRange;
    if (hStart <= hEnd) {
        return (hStart <= h && h <= hEnd);
    }
    return (hStart <= h || h <= hEnd);
}

function unitedMaps<T>(m1: Map<string, T>, m2: Map<string, T>) {
    return new Map(Array.from(m1).concat(Array.from(m2)));
}

function generateLogical() {

    const black = { k: "#000000", v: new Color(0, { c: 0, h: 0 }) };
    const black1 = { k: "#010101", v: new Color(1, { c: 0, h: 0 }) };
    const white = { k: "#ffffff", v: new Color(100, { c: 0, h: 0 }) };
    const white1 = { k: "#fefefe", v: new Color(99, { c: 0, h: 0 }) };

    const chromaLimit = 8;
    const upperLimit = 70;
    const lowerLimit = 40;
    const sufficientNumber = 0.01 * totalPixels;
    console.log("chromaN", sufficientNumber);

    function arrIsLargeEnough(arr: [string, Color][], enough: number) {
        if (arr.length == 0) return false;
        const q = arr.map(([k, v]) => v.q).reduce((e1, e2) => (e1 + e2));
        console.log("q", q);
        return q > enough;
    }

    const upperCylinderContainsChroma = arrIsLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l > upperLimit && v.c > 0.5)), sufficientNumber);
    const lowerCylinderContainsChroma = arrIsLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l < lowerLimit && v.c > 0.5)), sufficientNumber);
    console.log("grayN", 0.2 * totalPixels);
    const theresALotOfGray = arrIsLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l > 30 && v.l < 80 && v.c < chromaLimit)), 0.2 * totalPixels);
    const centralChromaTorus = new Map(Array.from(imgMap.value).filter(([k, v]) => (v.c > chromaLimit)));

    //debugMap.value = centralChromaTorus;

    if (!centralChromaTorus.size) {
        // видимо, это нечто серое
        console.log("gray");

        const newMap = new Map(imgMap.value);
        if (!upperCylinderContainsChroma) {
            newMap.set(white.k, white.v);
            newMap.set(white1.k, white1.v);
        }

        if (!lowerCylinderContainsChroma) {
            newMap.set(black.k, black.v);
            newMap.set(black1.k, black1.v);
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
            return generateRegressionFromMap(imgMap.value, "all");

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
            otherPart.set(white.k, white.v);
            otherPart.set(white1.k, white1.v);
        }

        if (!lowerCylinderContainsChroma) {
            otherPart.set(black.k, black.v);
            otherPart.set(black1.k, black1.v);
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
            otherPart.set(white.k, white.v);
            otherPart.set(white1.k, white1.v);
        }

        if (!lowerCylinderContainsChroma) {
            otherPart.set(black.k, black.v);
            otherPart.set(black1.k, black1.v);
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

watch(userImg, () => {
    imgMap.value = fillMapFromImg();

    //generateRegressionSimple();
    mapsClustered.value = [];
    generatedMap.value = generateLogical();

});



</script>

<template>
    <div class="row userUpload">
        <DropBox v-model:pixels="userImg">Загрузите изображение сюда
        </DropBox>
        <MapPlot3d :k="500" :data="imgMap" :totalQ="totalPixels" />
        <MapPlot3d :k="500" :data="debugMap" :totalQ="totalPixels" style="border: 1px solid red;" />
    </div>
    <ArrayOfPlots :maps="mapsClustered" :totalQ="totalPixels" />
    <div class="m1">
        <MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" />
        <div class="mockups">
            <MockUp :colors="generatedDark" />
            <MockUp :colors="generatedLight" />
            <MockUp :colors="generatedDarkHighContrast" />
            <MockUp :colors="generatedLightHighContrast" />
        </div>
    </div>
</template>