<script setup lang="ts">
import chroma from 'chroma-js';
import { kmeans } from 'ml-kmeans';
import { PolynomialRegression } from 'ml-regression';
import { reactive, ref, watch } from 'vue';
import ArrayOfPlots from './ArrayOfPlots.vue';
import Dropbox from './Dropbox.vue';
import MapPlot3d from './MapPlot3d.vue';
import Mockup from './Mockup.vue';
import { cartesianFromPolar, polarFromCartesian } from './math';
import { ColorInMap, accentColorRoles, bgColorRoles, colorRoles, type MockupColors, type Theme } from './myTypes';

const userImg = ref<Uint8ClampedArray>();
let totalPixels = 1;
const imgMap = ref<Map<string, ColorInMap>>(new Map());
const debugMap = ref<Map<string, ColorInMap>>(new Map());
const generatedMap = ref<Map<string, ColorInMap>>(new Map());
let imgMaxL: number;
let imgMinL: number;

function fillMapFromImg() {
    const newImgMap: Map<string, ColorInMap> = new Map();
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
        let elem: ColorInMap;
        if (!newImgMap.has(colorString)) {

            q = 1;
            let [l, c, h] = rgb.oklch();

            if (!l) l = 0;
            if (!c) c = 0;
            if (!h) h = 0;
            // потому что у меня в процентах, а не доля от 1
            l *= 100;
            c *= 100;

            let [x, y] = cartesianFromPolar(c, h);
            elem = new ColorInMap(l, c, h, x, y, q);

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

const darkTheme: Theme = {
    bg: {
        l: 20,
        cMax: 3,
    },
    overlay: {
        l: 28,
        cMax: 5,
    },
    accentLarge: {
        l: 50,
        cMax: 15,
    },
    accentSmall: {
        l: 78,
        cMax: 15,
    },
    text: {
        l: 96,
        cMax: 3,
    },
    textOnAccent: {
        l: 96,
        cMax: 3,
    }
};
const darkThemeHighContrast: Theme = {
    bg: {
        l: 20,
        cMax: 3,
    },
    overlay: {
        l: 28,
        cMax: 5,
    },
    accentLarge: {
        l: 80,
        cMax: 15,
    },
    accentSmall: {
        l: 80,
        cMax: 15,
    },
    text: {
        l: 96,
        cMax: 3,
    },
    textOnAccent: {
        l: 20,
        cMax: 3,
    }
};
const lightTheme: Theme = {
    bg: {
        l: 96,
        cMax: 3,
    },
    overlay: {
        l: 88,
        cMax: 5,
    },
    accentLarge: {
        l: 75,
        cMax: 15,
    },
    accentSmall: {
        l: 50,
        cMax: 15,
    },
    text: {
        l: 20,
        cMax: 3,
    },
    textOnAccent: {
        l: 20,
        cMax: 3,
    }
};

const lightThemeHighContrast: Theme = {
    bg: {
        l: 96,
        cMax: 3,
    },
    overlay: {
        l: 88,
        cMax: 5,
    },
    accentLarge: {
        l: 40,
        cMax: 15,
    },
    accentSmall: {
        l: 40,
        cMax: 15,
    },
    text: {
        l: 20,
        cMax: 3,
    },
    textOnAccent: {
        l: 96,
        cMax: 3,
    }
};

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

/*
function generateRegressionSimple() {

    generatedMap.clear();

    const l = Array.from(imgMap.values(), (v) => v.l);
    const x = Array.from(imgMap.values(), (v) => v.x);
    const y = Array.from(imgMap.values(), (v) => v.y);
    const xFromL = new PolynomialRegression(l, x, 2);
    const yFromL = new PolynomialRegression(l, y, 2);

    themes.forEach(([themeRules, generatedTheme]) => {
        colorRoles.forEach((key) => {
            let { l, cMax } = themeRules[key];

            let x = xFromL.predict(l);
            let y = yFromL.predict(l);
            let [c, h] = polarFromCartesian(x, y);
            if (c > cMax) c = cMax;

            let elem = new ColorInMap(l, c, h, x, y, 1);
            let rgbString = elem.adjustForRGB();

            generatedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
    });
}*/


const mapsClustered = ref([new Map()]);
function makeClusters(mapOfColors: Map<string, ColorInMap>, numberOfClusters: number) {
    //const coords = Array.from(mapOfColors.values(), (v) => [v.x, v.y]);
    const coords = Array.from(mapOfColors.values(), (v) => cartesianFromPolar(1, v.h));

    const clusterIndexesForPoints = kmeans(coords, numberOfClusters, { initialization: "mostDistant" }).clusters;
    const clusters: Map<string, ColorInMap>[] = [];
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
            const clusterMap: Map<string, ColorInMap> = new Map();
            indexesInCluster.forEach((i) => {
                clusterMap.set(initialKeys[i], imgMap.value.get(initialKeys[i])!);
            })
            return clusterMap;
        })
    */

    const clustersMaxChromas = mapsClustered.value.map((map: Map<string, ColorInMap>) =>
        Math.max(...Array.from(map.values(), (v) => v.c))
    );
    const maxChroma = Math.max(...clustersMaxChromas);

    const clustersLRanges = mapsClustered.value.map((map: Map<string, ColorInMap>) => {
        let l = Array.from(map.values(), (v) => v.l);
        return Math.max(...l) - Math.min(...l);
    }
    );
    const maxLRange = Math.max(...clustersLRanges);


    const newGeneratedMap: Map<string, ColorInMap> = new Map();

    for (let i in mapsClustered.value) {//TODO сделано только для 2 кластеров
        const map: Map<string, ColorInMap> = mapsClustered.value[i];
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
                let { l, cMax } = themeRules[key];

                let x = xFromL.predict(l);
                let y = yFromL.predict(l);
                let [c, h] = polarFromCartesian(x, y);
                if (c > cMax) c = cMax;

                let elem = new ColorInMap(l, c, h, x, y, 1);
                let rgbString = elem.adjustForRGB();

                newGeneratedMap.set(rgbString, elem);

                generatedTheme[key] = rgbString;
            });
        });
    }

    return newGeneratedMap;
}


function arraysForRegression(m: Map<string, ColorInMap>) {
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

function generateRegressionFromMap(mapOfColors: Map<string, ColorInMap>, roles: string) {

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

    const newGeneratedMap: Map<string, ColorInMap> = new Map();

    //console.log(mapOfColors);
    if (mapOfColors.size == 0) {
        console.log("empty map");
        return newGeneratedMap;
    }
    if (mapOfColors.size == 1) {
        themes.forEach(([themeRules, generatedTheme]) => {
            currentColorRoles.forEach((key) => {
                let { l, cMax } = themeRules[key];

                let { c, h } = Array.from(mapOfColors)[0][1];
                if (c > cMax) c = cMax;

                let [x, y] = cartesianFromPolar(c, h);
                let elem = new ColorInMap(l, c, h, x, y, 1);
                let rgbString = elem.adjustForRGB();

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
            let { l, cMax } = themeRules[key];

            let x = xFromL.predict(l);
            let y = yFromL.predict(l);
            let [c, h] = polarFromCartesian(x, y);
            if (c > cMax) c = cMax;

            let elem = new ColorInMap(l, c, h, x, y, 1);
            let rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
    });
    return newGeneratedMap;
}

function hRangeOfMap(mapOfColors: Map<string, ColorInMap>) {
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

    const black = { k: "#000000", v: new ColorInMap(0, 0, 0, 0, 0, 1) };
    const black1 = { k: "#010101", v: new ColorInMap(1, 0, 0, 0, 0, 1) };
    const white = { k: "#ffffff", v: new ColorInMap(100, 0, 0, 0, 0, 1) };
    const white1 = { k: "#fefefe", v: new ColorInMap(99, 0, 0, 0, 0, 1) };

    const chromaLimit = 8;
    const upperLimit = 70;
    const lowerLimit = 40;
    const sufficientNumber = 0.01 * totalPixels;
    console.log("chromaN", sufficientNumber);

    function arrLargeEnough(arr: [string, ColorInMap][], enough: number) {
        if (arr.length == 0) return false;
        const q = arr.map(([k, v]) => v.q).reduce((e1, e2) => (e1 + e2));
        console.log("q", q);
        return q > enough;
    }

    const upperCylinderContainsChroma = arrLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l > upperLimit && v.c > 0.5)), sufficientNumber);
    const lowerCylinderContainsChroma = arrLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l < lowerLimit && v.c > 0.5)), sufficientNumber);
    console.log("grayN", 0.2 * totalPixels);
    const theresALotOfGray = arrLargeEnough(Array.from(imgMap.value).filter(([k, v]) => (v.l > 30 && v.l < 80 && v.c < chromaLimit)), 0.2 * totalPixels);
    const centralChromaTorus = new Map(Array.from(imgMap.value).filter(([k, v]) => (v.c > chromaLimit)));

    debugMap.value = centralChromaTorus;

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


    //TODO вот эта часть с вычислением числа кластеров для определения моно/компл/триада работает очень криво
    // скорее всего, потому что фиксированно заданы границы шагов гистограммы
    // мб добавить сюда кластеризацию через плотность
    const numberOfSectors = 6;
    const sectorSize = 360 / numberOfSectors;
    const hHistogram = new Array(numberOfSectors);
    hHistogram.fill(0);
    const hVariation = Array.from(centralChromaTorus, ([k, v]) => v.h);
    hVariation.forEach((h) => {
        const sectorNumber = Math.floor(h / sectorSize);
        hHistogram[sectorNumber]++;
    });

    const totalInHist = hHistogram.reduce((s, v) => (s + v));
    let histSorted = Array.from(hHistogram, (v, k) => ({ v: v, k: k })).sort((e1, e2) => (e2.v - e1.v));
    let sum = 0;
    let sectorsInSum = 0;
    while (sum < 80) {
        sum += (100 * histSorted[sectorsInSum].v / totalInHist);
        sectorsInSum++;
    }



    function areNeighbors(k1: number, k2: number) {
        const d = Math.abs(k1 - k2);
        return (d == 1 || d == (numberOfSectors - 1));
    }
    function areNeighborsArr(k: number[]) {
        k.sort((a, b) => a - b);
        for (let i = 1; i < k.length; i++) {
            if (k[i] - k[i - 1] != 1) {
                if (!(k[i] == (numberOfSectors - 1) && k[0] == 1))
                    return false;
            }
        }
        return true;
    }

    //TODO? тут 3 привязано к 6 секторам всего, потому что 180 градусов
    if ((sectorsInSum == 1) ||
        (sectorsInSum == 2 && areNeighbors(histSorted[0].k, histSorted[1].k))
    ) {
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

        debugMap.value = centralChromaTorus;

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

    if ((sectorsInSum == 2) ||
        (sectorsInSum == 3 && areNeighborsArr([histSorted[0].k, histSorted[1].k, histSorted[2].k]))
    ) {
        // комплементарная
        console.log("complementary");

        mapsClustered.value = makeClusters(centralChromaTorus, 2);

        //TODO? считаю по максимальной насыщенности, мб надо по средней
        const [c0, c1] = mapsClustered.value.map((map: Map<string, ColorInMap>) =>
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

    mapsClustered.value = makeClusters(centralChromaTorus, 3);
    //TODO

    const newGeneratedMap: Map<string, ColorInMap> = new Map();
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
    <div class="col page">
        <div class="row userUpload">
            <Dropbox v-model:pixels="userImg">Загрузите изображение сюда
            </Dropbox>
            <MapPlot3d :k="500" :data="imgMap" :totalQ="totalPixels" />
            <MapPlot3d :k="500" :data="debugMap" :totalQ="totalPixels" style="border: 1px solid red;" />
        </div>

        <ArrayOfPlots :maps="mapsClustered" :totalQ="totalPixels" />
        <div class="m1">
            <MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" />
            <div class="mockups">
                <Mockup :colors="generatedDark"></Mockup>
                <Mockup :colors="generatedLight"></Mockup>
                <Mockup :colors="generatedDarkHighContrast"></Mockup>
                <Mockup :colors="generatedLightHighContrast"></Mockup>
            </div>
        </div>
    </div>
</template>
<style scoped>
.page {
    padding: 1rem;
    gap: 1rem;
}

.userUpload {
    gap: 2rem;
    align-items: stretch;

    &>* {
        flex-grow: 1;
        flex-shrink: 1;
        max-height: max(40vh, 200px);
    }
}
</style>
<style>
.mockups {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr 1fr;

}

.m1 {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr 2fr;
}

.row {
    display: flex;
    flex-flow: row nowrap;
}

.col {
    display: flex;
    flex-flow: column nowrap;
}
</style>
