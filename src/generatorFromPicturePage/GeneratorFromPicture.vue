<script setup lang="ts">
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import { Color, type ColorMap, type MockupColors } from '@/model/myTypes.ts';
import { darkTheme, lightTheme } from '@/model/themes';
import ArrayOfPlots from '@/plots/ArrayOfPlots.vue';
import { defineAsyncComponent, inject, ref, shallowRef, type Ref } from 'vue';
import InputPicture from './InputPicture.vue';
import { generateLRangeBased } from './generatorFromPictureEngine';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const imgMap = ref<ColorMap>();
const totalPixels = ref(1);

const chromaTorusMap = shallowRef(new Map<string, Color>());
const filteredMap = shallowRef(new Map<string, Color>());
const mapsClustered = shallowRef<Map<string, Color>[]>([]);

const polarHistogramData1 = ref<number[]>([]);
const polarHistogramData2 = ref<number[]>([]);
const polarHistogramCircle = ref(0);
const polarHistogramBorders = ref<number[]>([]);

const graysMap = shallowRef(new Map<string, Color>());

const generatedDark = ref<MockupColors>({});
const generatedLight = ref<MockupColors>({});

function generate() {
    if (!imgMap.value) return;
    totalPixels.value = imgMap.value.totalQ;
    const { generatedThemes, debugInfo } = generateLRangeBased(
        imgMap.value.data,
        imgMap.value.totalQ,
        new Map([
            ['dark', darkTheme],
            ['light', lightTheme],
        ]),
    );
    generatedDark.value = generatedThemes.get('dark') ?? {};
    generatedLight.value = generatedThemes.get('light') ?? {};

    mapsClustered.value = debugInfo.mapsClustered;
    graysMap.value = debugInfo.grays;
    chromaTorusMap.value = debugInfo.chromaTorus;

    polarHistogramData1.value = debugInfo.clusteringDebug.circularHistogram ?? [];
    polarHistogramData2.value = debugInfo.clusteringDebug.smoothedCircularHistogram ?? [];
    polarHistogramCircle.value = debugInfo.clusteringDebug.minQForHistogram ?? 0;
    polarHistogramBorders.value = debugInfo.clusteringDebug.borders ?? [];
    filteredMap.value = new Map(debugInfo.clusteringDebug.filteredPoints);
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
                v-if="imgMap?.totalQ"
            />
        </div>
        <div v-if="showPlots && imgMap?.totalQ" class="col">
            <div class="row">
                <ColorModels3d :k="0.01" :data="imgMap.data" :totalQ="totalPixels" wireframe />
                <ColorModels3d
                    :k="0.01"
                    :data="chromaTorusMap"
                    :totalQ="totalPixels"
                    style="border: 1px solid red"
                    wireframe
                />
                <ColorModels3d
                    :k="0.01"
                    :data="filteredMap"
                    :totalQ="totalPixels"
                    style="border: 1px solid red"
                    wireframe
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
