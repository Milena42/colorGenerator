<script setup lang="ts">
import { reactive, ref } from 'vue';
import MapPlot3d from './MapPlot3d.vue';
import Mockup from './Mockup.vue';
import type { ColorInMap, MockupColors, Theme } from './myTypes';
import { darkTheme, darkThemeHighContrast, lightTheme, lightThemeHighContrast } from './themes';

const generatedMap = ref<Map<string, ColorInMap>>(new Map());


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
</script>
<template>
    <div>
        <!--TODO: цветовой круг и генерация по нему-->



    </div>

    <div class="m1">
        <MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" />
        <div class="mockups">
            <Mockup :colors="generatedDark"></Mockup>
            <Mockup :colors="generatedLight"></Mockup>
            <Mockup :colors="generatedDarkHighContrast"></Mockup>
            <Mockup :colors="generatedLightHighContrast"></Mockup>
        </div>
    </div>
</template>