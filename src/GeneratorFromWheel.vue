<script setup lang="ts">
import { reactive, ref, watch, type Ref } from 'vue';
import ColorWheel from './ColorWheel.vue';
//import MapPlot3d from './MapPlot3d.vue';
import MockUp from './MockUp.vue';
import { hMinus } from './math';
import { Color, accentColorRoles, bgColorRoles, schemeTypes, type MockupColors, type Theme, type schemeType } from './myTypes';
import { darkTheme, darkThemeHighContrast, lightTheme, lightThemeHighContrast, maxCAccent, maxCBg } from './themes';

const generatedMap: Ref<Map<string, Color>> = ref<Map<string, Color>>(new Map<string, Color>());



type HFromL = (l: number) => number;
const schemeRulesFromInputs = new Map<schemeType, HFromL>([
    ["mono", (l) => { return inputAccent.h; }],
    ["complementary", (l) => {
        if (30 <= l && l <= 80)
            return inputAccent.h;
        return inputBg.h;
    }],
    ["analog", (l) => {
        return (2 * hMinus(inputSecondary.h, inputAccent.h) * (l - 50) / 100 + inputAccent.h + 360) % 360;
    }],
    ["triad", (l) => {
        if (l <= 30) return inputBg.h;
        if (l <= 80) return inputAccent.h;
        return inputSecondary.h;
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
const inputSecondary = reactive(new Color(50, { c: 20, h: 0 }));
const inputBg = reactive(new Color(50, { c: 20, h: 0 }));

const typeOfScheme = ref<schemeType>(schemeTypes[0]);

const inputCBg = ref<number>(maxCBg);
const inputCAccent = ref<number>(maxCAccent);

function generateGrayAndAccents() {
    const newGeneratedMap: Map<string, Color> = new Map();
    themes.forEach(([themeRules, generatedTheme]) => {
        accentColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];



            const h = schemeRulesFromInputs.get(typeOfScheme.value)!(l);

            const c = cMax * inputCAccent.value / maxCAccent;

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
        bgColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];


            const h = schemeRulesFromInputs.get(typeOfScheme.value)!(l);


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

watch([inputAccent, inputBg, inputSecondary], generate);

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

function changeTypeOfScheme() {
    const accentH = inputAccent.h;
    switch (typeOfScheme.value) {
        case "mono":
            break;
        case "complementary":
            inputBg.h = (accentH + 180) % 360;
            break;
        case "analog":
            inputBg.h = (accentH + 60) % 360;
            inputSecondary.h = (accentH - 60 + 360) % 360;
            break;
        case "triad":
            inputBg.h = (accentH + 120) % 360;
            inputSecondary.h = (accentH - 120 + 360) % 360;
            break;
        default: break;
    }
    //TODO положение кругов тоже надо обновлять - видимо, придется объединить компоненты
    generate();
}
</script>
<template>
    <div class="row">
        <div>
            <select v-model="typeOfScheme" @change="changeTypeOfScheme">
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
            <ColorWheel v-model:accent="inputAccent" v-model:secondary="inputSecondary" v-model:bg="inputBg"
                v-model:accentChroma="inputCAccent" v-model:bgChroma="inputCBg" :typeOfScheme="typeOfScheme" />
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