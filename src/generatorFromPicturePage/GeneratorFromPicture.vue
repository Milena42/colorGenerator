<script setup lang="ts" generic="T extends string, R extends string">
import { lockBodyInteractions, unlockBodyInteractions } from '@/assets/animationLockController';
import { Color, type ColorMap, type MockupColors, type ThemeParams } from '@/generator/common';
import { GeneratorFromPicture, type GeneratedThemes } from '@/generator/generatorFromPictureEngine';
import { SHOW_PLOTS } from '@/injectionKeys';
import ArrayOfPlots from '@/plots/ArrayOfPlots.vue';
import {
    computed,
    defineAsyncComponent,
    inject,
    ref,
    shallowRef,
    watch,
    type Component,
} from 'vue';
import InputPicture from './InputPicture.vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    themeParams: ThemeParams<T, R>;
    ColorsOutput: Component<{ colors: Record<T, MockupColors<R>> }>;
}>();

const imgMap = ref<ColorMap>();
const totalPixels = ref(1);

watch(
    () => props.themeParams,
    () => {
        generate();
    },
);

const chromaTorusMap = shallowRef(new Map<string, Color>());

const mapsClustered = shallowRef<Map<string, Color>[]>([]);

const polarHistogramData1 = ref<number[]>([]);
const polarHistogramData2 = ref<number[]>([]);
const polarHistogramCircle = ref(0);
const polarHistogramBorders = ref<number[]>([]);

const graysMap = shallowRef(new Map<string, Color>());

const loading = ref(false);
const loaderVisible = ref(false);

let generator: GeneratorFromPicture | undefined;

async function startLoading(isLong: boolean) {
    loading.value = true;
    lockBodyInteractions();
    loaderVisible.value = isLong;
}

async function stopLoading() {
    loading.value = false;
    loaderVisible.value = false;
    unlockBodyInteractions();
}

async function setPicture() {
    if (!imgMap.value) return;

    totalPixels.value = imgMap.value.totalQ;
    generator = await GeneratorFromPicture.create(imgMap.value.data, imgMap.value.totalQ);
    generate();

    stopLoading();
}

const themeVariants = ref<GeneratedThemes<T, R>>();

const generated = computed(() => {
    if (!themeVariants.value) {
        return undefined;
    }
    const variants = themeVariants.value;

    const themes: Record<T, MockupColors<R>> = Object.create(null);
    props.themeParams.themeKeys.forEach((themeName) => {
        themes[themeName] = Object.create(null);
        props.themeParams.roleKeys.forEach((role) => {
            const id = variants[themeName].chosen[role];
            themes[themeName][role] = variants[themeName].variants[role][id];
        });
    });
    return themes;
});

function generate() {
    if (!generator) return;

    const generatedThemes = generator.generate(props.themeParams);

    themeVariants.value = generatedThemes;

    const debugInfo = generator.debugInfo;

    mapsClustered.value = debugInfo.mapsClustered;
    graysMap.value = debugInfo.grays;
    chromaTorusMap.value = debugInfo.chromaTorus;

    polarHistogramData1.value = debugInfo.clusteringDebug?.circularHistogram ?? [];
    polarHistogramData2.value = debugInfo.clusteringDebug?.smoothedCircularHistogram ?? [];
    polarHistogramCircle.value = debugInfo.clusteringDebug?.minQForHistogram ?? 0;
    polarHistogramBorders.value = debugInfo.clusteringDebug?.borders ?? [];
}

const showPlots = inject(SHOW_PLOTS) ?? ref(false);
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

            <div class="editor-view" v-if="imgMap?.totalQ && generated">
                <component
                    class="grow editor-view-content"
                    :is="ColorsOutput"
                    :colors="generated"
                />
            </div>
        </div>
        <div v-if="imgMap?.totalQ && themeVariants" class="generator-picture-variants">
            <p>Выбрать другие варианты сгенерированных цветов:</p>
            <div>
                <div :key="themeName" v-for="themeName of themeParams.themeKeys" class="col">
                    <p>{{ themeName }}</p>
                    <div class="variants-grid">
                        <template :key="role" v-for="role of themeParams.roleKeys">
                            <p class="role-name">
                                {{ role }}
                            </p>
                            <div class="row">
                                <div
                                    :key="id"
                                    v-for="(color, id) of themeVariants[themeName].variants[role]"
                                    class="button-color-variant"
                                    :class="{
                                        'chosen-variant':
                                            themeVariants[themeName].chosen[role] == id,
                                    }"
                                >
                                    <button
                                        :style="{ background: color.adjustForRGB() }"
                                        @click="themeVariants[themeName].chosen[role] = id"
                                    ></button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
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
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-evenly;
    gap: 1rem;

    .dropbox {
        flex: 5 1 0;
        align-self: stretch;
    }
}

@media (max-width: 1800px) {
    .generator-picture-page-main {
        flex-flow: column nowrap;

        .dropbox {
            flex: 1 0 auto;
        }
    }
}

@media (min-width: 600px) and (max-width: 1800px) {
    .editor-view {
        width: 100%;
        overflow-x: auto;
        border: 2px solid var(--pale);
        border-radius: var(--radius);

        .editor-view-content {
            justify-content: center;
            min-height: 100%;
            width: max-content;
            padding: 1rem;
            margin: 0px auto;
        }
    }
}

.generator-picture-variants {
    margin: calc(var(--adaptive-gap) * 6) var(--adaptive-gap);
    text-align: center;

    & > div {
        display: flex;
        flex-flow: row wrap;
        justify-content: center;
        gap: calc(var(--adaptive-gap) * 8);

        row-gap: calc(var(--adaptive-gap) * 8);
        font-family: var(--font-mono);
    }

    .variants-grid {
        display: grid;
        grid-template-columns: auto auto;
        grid-auto-rows: auto;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
    }

    .role-name {
        margin: 0px;
        text-align: right;
    }

    .button-color-variant {
        border: 0.2rem solid var(--background);
        background: var(--background);
        padding: 0.3rem;
        border-radius: 50%;

        button {
            height: 2rem;
            width: 2rem;
            border-radius: 50%;
            border: 1px solid var(--transparent-border);
        }

        &.chosen-variant {
            border-color: var(--text);
            transform: scale(0.8);
        }
    }
}

.plots {
    margin: calc(var(--adaptive-gap) * 6) var(--adaptive-gap);
    align-items: stretch;
    gap: calc(var(--adaptive-gap) * 4);

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
