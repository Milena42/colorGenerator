<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import ColorWheel from './ColorWheel.vue';
import MockUp from './MockUp.vue';
import { Color, colorRoles, type ColorRole, type MockupColors, type Theme } from './myTypes';
import { darkTheme, darkThemeHighContrast, lightTheme, lightThemeHighContrast } from './themes';

const generatedMap = ref<Map<string, Color>>(new Map());

type HScheme = Record<ColorRole, number>;
const schemeTypes = ["mono", "complementary", "analog", "triad"];
type schemeType = (typeof schemeTypes)[number];

const schemeRules = new Map<string, HScheme>([
    ["mono", {
        bg: 0,
        overlay: 0,
        accentLarge: 0,
        accentSmall: 0,
        text: 0,
        textOnAccent: 0,
    }],
    ["complementary", {
        bg: 180,
        overlay: 180,
        accentLarge: 0,
        accentSmall: 0,
        text: 180,
        textOnAccent: 180,
    }],
    ["analog", {
        bg: -30,
        overlay: -15,
        accentLarge: 0,
        accentSmall: 0,
        text: 30,
        textOnAccent: 30,
    }],
    ["triad", {
        bg: -120,
        overlay: -120,
        accentLarge: 0,
        accentSmall: 120,
        text: 120,
        textOnAccent: -120,
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



const inputAccent = reactive(new Color(50, { c: 0, h: 0 }));

const typeOfScheme = ref<schemeType>(schemeTypes[0]);

function generate() {
    const newGeneratedMap: Map<string, Color> = new Map();
    themes.forEach(([themeRules, generatedTheme]) => {
        colorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];
            const hDifference = schemeRules.get(typeOfScheme.value)![key];

            const h = inputAccent.h + hDifference;
            let c = inputAccent.c;
            if (c > cMax) c = cMax;


            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
    });
    generatedMap.value = newGeneratedMap;
}

watch(inputAccent, generate);



</script>
<template>
    <div class="row">
        <div>
            <select v-model="typeOfScheme" @change="generate">
                <option v-for="t in schemeTypes" :value="t">{{ t }}</option>
            </select>

            <!--TODO: цветовой круг и генерация по нему-->
            <ColorWheel v-model:accent="inputAccent" />


        </div>

        <div class="m1">
            <!--<MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" /> TODO оно зависает-->
            <div class="mockups">
                <MockUp :colors="generatedDark"></Mockup>
                <MockUp :colors="generatedLight"></Mockup>
                <MockUp :colors="generatedDarkHighContrast"></Mockup>
                <MockUp :colors="generatedLightHighContrast"></Mockup>
            </div>
        </div>
    </div>
</template>