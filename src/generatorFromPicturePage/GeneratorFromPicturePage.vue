<script setup lang="ts">
import { Color, type ColorMap, type MockupColors, type Theme } from '@/generator/common';
import { GeneratorFromPicture } from '@/generator/generatorFromPictureEngine';
import { colorRoles, darkTheme, lightTheme, type ColorRole } from '@/generator/themesExample';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import ArrayOfPlots from '@/plots/ArrayOfPlots.vue';
import { defineAsyncComponent, inject, ref, shallowRef, watch, type Ref } from 'vue';
import InputPicture from './InputPicture.vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const imgMap = ref<ColorMap>();
const totalPixels = ref(1);

const darkThemeModified = inject<Ref<Theme<ColorRole>>>('darkThemeLightness');
const lightThemeModified = inject<Ref<Theme<ColorRole>>>('lightThemeLightness');
watch([darkThemeModified, lightThemeModified], () => {
    generate();
});

const chromaTorusMap = shallowRef(new Map<string, Color>());

const mapsClustered = shallowRef<Map<string, Color>[]>([]);

const polarHistogramData1 = ref<number[]>([]);
const polarHistogramData2 = ref<number[]>([]);
const polarHistogramCircle = ref(0);
const polarHistogramBorders = ref<number[]>([]);

const graysMap = shallowRef(new Map<string, Color>());

const generatedDark = ref<MockupColors<ColorRole>>();
const generatedLight = ref<MockupColors<ColorRole>>();

const loading = ref(false);
const loaderVisible = ref(false);

let generator: GeneratorFromPicture | undefined;

async function startLoading(isLong: boolean) {
    loading.value = true;
    document.body.style.pointerEvents = 'none';
    loaderVisible.value = isLong;
}

async function stopLoading() {
    loading.value = false;
    loaderVisible.value = false;
    document.body.style.pointerEvents = 'auto';
}

async function setPicture() {
    if (!imgMap.value) return;

    totalPixels.value = imgMap.value.totalQ;
    generator = await GeneratorFromPicture.create(imgMap.value.data, imgMap.value.totalQ);
    generate();

    stopLoading();
}

function generate() {
    if (!generator) return;

    const generatedThemes = generator.generate({
        themeKeys: ['dark', 'light'],
        roleKeys: colorRoles,
        themes: {
            dark: darkThemeModified?.value ?? darkTheme,
            light: lightThemeModified?.value ?? lightTheme,
        },
    });

    generatedDark.value = generatedThemes.dark;
    generatedLight.value = generatedThemes.light;

    const debugInfo = generator.debugInfo;

    mapsClustered.value = debugInfo.mapsClustered;
    graysMap.value = debugInfo.grays;
    chromaTorusMap.value = debugInfo.chromaTorus;

    polarHistogramData1.value = debugInfo.clusteringDebug?.circularHistogram ?? [];
    polarHistogramData2.value = debugInfo.clusteringDebug?.smoothedCircularHistogram ?? [];
    polarHistogramCircle.value = debugInfo.clusteringDebug?.minQForHistogram ?? 0;
    polarHistogramBorders.value = debugInfo.clusteringDebug?.borders ?? [];
}

const showPlots: Ref<boolean> = inject('showPlots') ?? ref(false);
</script>

<template>
    <div class="col">
        <div class="grow generator-picture-page-main">
            <InputPicture
                v-model:imgMap="imgMap"
                @change="setPicture"
                @loading="startLoading"
                @stopLoading="stopLoading"
            />
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
        <Transition name="loader">
            <div
                class="loading-overlay"
                v-show="loading"
                :class="{ 'loader-visible': loaderVisible }"
                @pointerdown.stop.capture
                @click.stop.capture
            >
                <span class="loading-spinner"></span>
            </div>
        </Transition>
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

<style>
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    z-index: 100;

    display: flex;
    justify-content: center;
    align-items: center;

    pointer-events: all;

    background: #00000000;

    &.loader-visible {
        background: var(--transparent-overlay);
        .loading-spinner {
            visibility: visible;
        }
    }

    .loading-spinner {
        visibility: hidden;
        position: sticky;
        bottom: 40vh;
    }
}

.loading-spinner {
    display: inline-block;
    width: 50px;
    height: 50px;
    border: 6px dotted var(--accent-small);
    border-bottom: none;
    border-left: none;
    border-radius: 50%;
    box-sizing: border-box;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loader-enter-to,
.loader-leave-from {
    opacity: 1;
}

.loader-enter-from,
.loader-leave-to {
    opacity: 0;
}

.loader-enter-active {
    transition: opacity 0.5s ease-in-out;
}

.loader-leave-active {
    transition: opacity 0.1s ease-in-out;
}
</style>
