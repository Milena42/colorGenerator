<script setup lang="ts">
import { Color, type ColorMap, type MockupColors } from '@/generator/common';
import { generateLRangeBased } from '@/generator/generatorFromPictureEngine';
import { colorRoles, darkTheme, lightTheme, type ColorRole } from '@/generator/themesExample';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import ArrayOfPlots from '@/plots/ArrayOfPlots.vue';
import { defineAsyncComponent, inject, ref, shallowRef, type Ref } from 'vue';
import InputPicture from './InputPicture.vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const imgMap = ref<ColorMap>();
const totalPixels = ref(1);

const chromaTorusMap = shallowRef(new Map<string, Color>());

const mapsClustered = shallowRef<Map<string, Color>[]>([]);

const polarHistogramData1 = ref<number[]>([]);
const polarHistogramData2 = ref<number[]>([]);
const polarHistogramCircle = ref(0);
const polarHistogramBorders = ref<number[]>([]);

const graysMap = shallowRef(new Map<string, Color>());

const generatedDark = ref<MockupColors<ColorRole>>();
const generatedLight = ref<MockupColors<ColorRole>>();

function generate() {
    if (!imgMap.value) return;
    totalPixels.value = imgMap.value.totalQ;
    const { generatedThemes, debugInfo } = generateLRangeBased(
        imgMap.value.data,
        imgMap.value.totalQ,
        ['dark', 'light'],
        colorRoles,
        {
            dark: darkTheme,
            light: lightTheme,
        },
    );
    generatedDark.value = generatedThemes.dark;
    generatedLight.value = generatedThemes.light;

    mapsClustered.value = debugInfo.mapsClustered;
    graysMap.value = debugInfo.grays;
    chromaTorusMap.value = debugInfo.chromaTorus;

    polarHistogramData1.value = debugInfo.clusteringDebug.circularHistogram ?? [];
    polarHistogramData2.value = debugInfo.clusteringDebug.smoothedCircularHistogram ?? [];
    polarHistogramCircle.value = debugInfo.clusteringDebug.minQForHistogram ?? 0;
    polarHistogramBorders.value = debugInfo.clusteringDebug.borders ?? [];
}

const showPlots: Ref<boolean> = inject('showPlots') ?? ref(false);
</script>

<template>
    <div class="col">
        <div class="grow generator-picture-page-main">
            <InputPicture v-model:imgMap="imgMap" @change="generate" />
            <MockupEditor
                class="grow"
                :colorsDark="generatedDark"
                :colorsLight="generatedLight"
                v-if="imgMap?.totalQ && generatedDark && generatedLight"
            />
        </div>
        <div v-if="showPlots && imgMap?.totalQ" class="col plots">
            <div class="row">
                <figure>
                    <ColorModels3d :k="0.01" :data="imgMap.data" :totalQ="totalPixels" wireframe />
                    <figcaption>Все цвета изображения</figcaption>
                </figure>
                <figure>
                    <ColorModels3d
                        :k="0.01"
                        :data="chromaTorusMap"
                        :totalQ="totalPixels"
                        wireframe
                    />
                    <figcaption>Насыщенные цвета</figcaption>
                </figure>
                <figure>
                    <ColorModels3d :k="0.01" :data="graysMap" :totalQ="totalPixels" wireframe />
                    <figcaption>Ненасыщенные цвета</figcaption>
                </figure>
            </div>

            <p v-if="mapsClustered.length > 1">Кластеры насыщенных цветов:</p>
            <ArrayOfPlots
                v-if="mapsClustered.length > 1"
                :maps="mapsClustered"
                :totalQ="totalPixels"
                class="clusters"
            />
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

.plots {
    margin: 6rem 1rem;
    align-items: stretch;
    gap: 4rem;

    p {
        text-align: center;
    }

    > div {
        justify-content: space-around;
        gap: 2rem;
    }

    .clusters {
        flex-flow: row wrap;
        gap: 2rem;
        justify-content: center;
    }
}
</style>
