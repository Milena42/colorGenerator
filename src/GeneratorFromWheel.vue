<script setup lang="ts">
import { reactive, ref, watch, type Ref } from 'vue';
import ColorWheel from './ColorWheel.vue';
//import MapPlot3d from './MapPlot3d.vue';
import MockUp from './MockUp.vue';
import { Color, accentColorRoles, bgColorRoles, type MockupColors, type Theme } from './myTypes';
import { darkTheme, darkThemeHighContrast, lightTheme, lightThemeHighContrast, maxCAccent, maxCBg } from './themes';

const generatedMap: Ref<Map<string, Color>> = ref<Map<string, Color>>(new Map<string, Color>());

const schemeTypes = ["mono", "complementary", "analog", "triad"];
type schemeType = (typeof schemeTypes)[number];

type HDifferenceFromL = (l: number) => number;

const schemeRules = new Map<string, HDifferenceFromL>([
    ["mono", (l) => { return 0; }],
    ["complementary", (l) => {
        if (30 <= l && l <= 80)
            return 0;
        return 180;
    }],
    ["analog", (l) => {
        return 180 * (l - 50) / 100;
    }],
    ["triad", (l) => {
        if (l <= 30) return -120;
        if (l <= 80) return 0;
        return 120;
    }]
]);



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



const inputAccent = reactive(new Color(50, { c: 20, h: 0 }));

const typeOfScheme = ref<schemeType>(schemeTypes[0]);

const inputCBg = ref<number>(maxCBg);
const inputCAccent = ref<number>(maxCAccent);

function generateGrayAndAccents() {
    const newGeneratedMap: Map<string, Color> = new Map();
    themes.forEach(([themeRules, generatedTheme]) => {
        accentColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];


            const hDifference = schemeRules.get(typeOfScheme.value)!(l);
            const h = inputAccent.h + hDifference;

            const c = cMax * inputCAccent.value / maxCAccent;

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
        bgColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];


            const hDifference = schemeRules.get(typeOfScheme.value)!(l);
            const h = inputAccent.h + hDifference;


            const c = cMax * inputCBg.value / maxCBg;


            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
    });
    return newGeneratedMap;
}

function generate() {
    // цветная - частный случай чб, когда насыщенность максимальна
    generatedMap.value = generateGrayAndAccents();

}

watch(inputAccent, generate);

function changeCBg() {
    if (inputCBg.value > inputCAccent.value) inputCAccent.value = inputCBg.value;
    inputAccent.c = inputCAccent.value;
    generate();
}

function changeCAccent() {
    if (inputCBg.value > inputCAccent.value) inputCBg.value = inputCAccent.value;
    inputAccent.c = inputCAccent.value;
    generate();
}

/*
    менять количество акцентных кругов в зависимости от фигуры
    мб показывать все полученные цвета на круге? но их много, большинство не управляемые (контуры?)
    фича поменять местами акценты (который тон на которую роль)
*/
</script>
<template>
    <div class="row">
        <div>
            <select v-model="typeOfScheme" @change="generate">
                <option v-for="t in schemeTypes" :value="t">{{ t }}</option>
            </select>
            <div class="col">
                <label>макс. насыщенность акцента</label>
                <input v-model.number="inputCAccent" @change="changeCAccent" type="range" :min="0" :max="maxCAccent"
                    :step="0.1" :style="{ width: maxCAccent + 'rem' }" list="values" />
                <datalist id="values">
                    <option value="0" label="0"></option>
                    <option value="1" label="1"></option>
                    <option value="5" label="5"></option>
                    <option value="15" label="15"></option>
                </datalist>
                <input v-model.number="inputCBg" @change="changeCBg" type="range" :min="0" :max="maxCBg" :step="0.1"
                    :style="{ width: maxCBg + 'rem' }" list="values" />
                <label>макс. насыщенность фона</label>
            </div>
            <ColorWheel v-model:accent="inputAccent" v-model:accentChroma="inputCAccent" v-model:bgChroma="inputCBg" />
        </div>

        <div class="m1">
            <!--<MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" /> --><!--TODO оно зависает-->
            <div class="mockups">
                <MockUp :colors="generatedDark"></Mockup>
                <MockUp :colors="generatedLight"></Mockup>
                <MockUp :colors="generatedDarkHighContrast"></Mockup>
                <MockUp :colors="generatedLightHighContrast"></Mockup>
            </div>
        </div>
    </div>
</template>