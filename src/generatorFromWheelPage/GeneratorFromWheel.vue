<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch, type ShallowRef } from 'vue';
import CircleInput, {
    circleObject,
    R_SPECTRAL_CIRCLE,
    SCALE,
    WHEEL_SVG_WIDTH,
} from './CircleInput.vue';

import IconAnalog from '@/assets/icons/IconAnalog.vue';
import IconComplementary from '@/assets/icons/IconComplementary.vue';
import IconMono from '@/assets/icons/IconMono.vue';
import IconTriad from '@/assets/icons/IconTriad.vue';

//import MapPlot3d from './MapPlot3d.vue';
import InputColorHString from '@/inputColor/InputColorHString.vue';
import InputNumber from '@/InputNumber.vue';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import {
    accentColorRoles,
    bgColorRoles,
    Color,
    schemeType,
    type MockupColors,
    type Theme,
} from '@/model/myTypes';
import { darkTheme, lightTheme, maxCAccent, maxCBg } from '@/model/themes';
import { hMinus } from '@/utilities/math';
import ArcShortest from './ArcShortest.vue';

const generatedMap: ShallowRef<Map<string, Color>> = shallowRef(new Map<string, Color>());

type HFromL = (l: number) => number;
const schemeRulesFromInputs = new Map<schemeType, HFromL>([
    [
        schemeType.mono,
        () => {
            return inputAccentH.value;
        },
    ],
    [
        schemeType.complementary,
        (l) => {
            if (35 <= l && l <= 80) return inputAccentH.value;
            return inputBgH.value;
        },
    ],
    [
        schemeType.analog,
        (l) => {
            return (
                ((2 * hMinus(inputSecondaryH.value, inputAccentH.value) * (l - 50)) / 100 +
                    inputAccentH.value +
                    360) %
                360
            );
        },
    ],
    [
        schemeType.triad,
        (l) => {
            if (l < 35) return inputBgH.value;
            if (l <= 80) return inputAccentH.value;
            return inputSecondaryH.value;
        },
    ],
]);

const generatedNewLight: MockupColors = reactive({});
const generatedNewDark: MockupColors = reactive({});

const themes: [Theme, MockupColors][] = [
    [lightTheme, generatedNewLight],
    [darkTheme, generatedNewDark],
];

const accentCircle = reactive(new circleObject(236));
const secondaryCircle = reactive(new circleObject(0));
const bgCircle = reactive(new circleObject(0));

const inputAccentH = computed({
    get: () => accentCircle.color.h,
    set: (v) => {
        accentCircle.color.h = v;
    },
});
const inputSecondaryH = computed({
    get: () => secondaryCircle.color.h,
    set: (v) => {
        secondaryCircle.color.h = v;
    },
});
const inputBgH = computed({
    get: () => bgCircle.color.h,
    set: (v) => {
        bgCircle.color.h = v;
    },
});

const typeOfScheme = ref<schemeType>(schemeType.mono);

const inputBgC = ref<number>(maxCBg);
const inputAccentC = ref<number>(maxCAccent);

function generateGrayAndAccents() {
    const newGeneratedMap: Map<string, Color> = new Map();
    themes.forEach(([themeRules, generatedTheme]) => {
        accentColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];

            const h = schemeRulesFromInputs.get(typeOfScheme.value)!(l);

            const c = (cMax * inputAccentC.value) / maxCAccent;

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = elem;
        });
        bgColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];

            const h = schemeRulesFromInputs.get(typeOfScheme.value)!(l);

            const c = (cMax * inputBgC.value) / maxCBg;

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = elem;
        });
    });
    return newGeneratedMap;
}

function generate() {
    // цветная - частный случай чб, когда насыщенность максимальна
    generatedMap.value = generateGrayAndAccents();
}

watch([inputAccentH, inputBgH, inputSecondaryH], generate, { immediate: true });

const CHROMA_DIFFERENCE = 5;
const accentHasGreaterChroma = computed(
    () => inputBgC.value + CHROMA_DIFFERENCE < inputAccentC.value,
);

watch(inputBgC, () => {
    if (!accentHasGreaterChroma.value) {
        inputAccentC.value = inputBgC.value + CHROMA_DIFFERENCE;
    }
    generate();
});

watch(inputAccentC, () => {
    if (!accentHasGreaterChroma.value) {
        const c = inputAccentC.value - CHROMA_DIFFERENCE;
        inputBgC.value = c > 0 ? c : 0;
    }
    generate();
});

function changeTypeOfScheme() {
    const accentH = inputAccentH.value;
    switch (typeOfScheme.value) {
        case 'mono':
            break;
        case 'complementary':
            inputBgH.value = (accentH + 180) % 360;
            break;
        case 'analog':
            inputBgH.value = (accentH + 60) % 360;
            inputSecondaryH.value = (accentH - 60 + 360) % 360;
            break;
        case 'triad':
            inputBgH.value = (accentH + 120) % 360;
            inputSecondaryH.value = (accentH - 120 + 360) % 360;
            break;
        default:
            break;
    }
    bgCircle.calculateCoords();
    secondaryCircle.calculateCoords();
    generate();
}

watch(typeOfScheme, changeTypeOfScheme);

let draggedCircle: typeof accentCircle | undefined = undefined;
let startX = 0;
let startY = 0;
let initialCircleX = 0;
let initialCircleY = 0;

function dragstart(element: typeof accentCircle, event: MouseEvent) {
    draggedCircle = element;
    startX = event.clientX;
    startY = event.clientY;
    initialCircleX = draggedCircle.cx;
    initialCircleY = draggedCircle.cy;
}

function mousemove(event: MouseEvent) {
    if (!draggedCircle) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    draggedCircle.cx = initialCircleX + deltaX;
    draggedCircle.cy = initialCircleY + deltaY;

    const oldH = draggedCircle.color.h;
    draggedCircle.calculateColorCoords();

    const currentH = draggedCircle.color.h;
    const accentH = accentCircle.color.h;
    if (draggedCircle === accentCircle) {
        const dH = currentH - oldH;
        bgCircle.color.h = (bgCircle.color.h + dH + 360) % 360;
        bgCircle.calculateCoords();
        secondaryCircle.color.h = (secondaryCircle.color.h + dH + 360) % 360;
        secondaryCircle.calculateCoords();
    } else if (draggedCircle === bgCircle) {
        if (typeOfScheme.value == 'complementary') {
            draggedCircle.color.h = oldH;
        } else {
            secondaryCircle.color.h = (2 * accentH - currentH + 360) % 360;
            secondaryCircle.calculateCoords();
        }
    } else if (draggedCircle === secondaryCircle) {
        bgCircle.color.h = (2 * accentH - currentH + 360) % 360;
        bgCircle.calculateCoords();
    }

    draggedCircle.color.c = R_SPECTRAL_CIRCLE;
    draggedCircle.calculateCoords();
}

function dragend() {
    draggedCircle = undefined;
}

const show2Circles = computed(() => {
    return typeOfScheme.value != 'mono';
});
const show3Circles = computed(() => {
    return typeOfScheme.value != 'mono' && typeOfScheme.value != 'complementary';
});

function reverseDependentHues() {
    [inputBgH.value, inputSecondaryH.value] = [inputSecondaryH.value, inputBgH.value];
    bgCircle.calculateCoords();
    secondaryCircle.calculateCoords();
}

const inputHFromColor = ref(false);

const baseH = computed({
    get: () => inputAccentH.value,
    set: (v) => {
        accentCircle.color.h = v;
        accentCircle.calculateCoords();
        changeTypeOfScheme();
    },
});
</script>
<template>
    <div class="generator-wheel-page">
        <div>
            <div class="choice-chips">
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == schemeType.mono }"
                    @click="typeOfScheme = schemeType.mono"
                    title="монохромная"
                >
                    <IconMono />
                </button>
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == schemeType.complementary }"
                    @click="typeOfScheme = schemeType.complementary"
                    title="комплементарная"
                >
                    <IconComplementary />
                </button>
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == schemeType.analog }"
                    @click="typeOfScheme = schemeType.analog"
                    title="аналоговая"
                >
                    <IconAnalog />
                </button>
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == schemeType.triad }"
                    @click="typeOfScheme = schemeType.triad"
                    title="триада"
                >
                    <IconTriad />
                </button>
            </div>
            <div class="col chroma-params">
                <p>максимальная насыщенность:</p>
                <div class="row">
                    <label for="accent-chroma">акценты</label>
                    <input
                        v-model.number="inputAccentC"
                        type="range"
                        :min="0"
                        :max="maxCAccent"
                        :step="0.1"
                        :style="{ width: maxCAccent + 'rem' }"
                        class="input-range"
                        id="accent-chroma"
                    />
                </div>
                <div class="row">
                    <label for="bg-chroma">фоновые</label>
                    <input
                        v-model.number="inputBgC"
                        type="range"
                        :min="0"
                        :max="maxCBg"
                        :step="0.1"
                        :style="{ width: maxCBg + 'rem' }"
                        class="input-range"
                        id="bg-chroma"
                    />
                </div>
            </div>
            <div class="color-wheel-square">
                <button
                    @click="reverseDependentHues"
                    class="color-wheel-square-reverse"
                    v-if="show3Circles"
                    title="поменять местами зависимые тона"
                >
                    <span class="material-symbols-rounded">swap_vert</span>
                </button>

                <div class="color-wheel-square-base-h">
                    <InputNumber v-model.lazy.number="baseH" :min="0" :max="360" :step="1" circle />
                </div>

                <div class="color-wheel-square-base-color">
                    <button v-if="!inputHFromColor" @click="inputHFromColor = true">
                        Из цвета
                    </button>
                    <InputColorHString
                        v-if="inputHFromColor"
                        v-model.lazy="baseH"
                        @change="inputHFromColor = false"
                    />
                </div>

                <svg
                    version="1.1"
                    :width="WHEEL_SVG_WIDTH"
                    :height="WHEEL_SVG_WIDTH"
                    class="color-wheel-svg"
                    ref="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    @mousemove.prevent="mousemove"
                    @mouseup.prevent="dragend"
                    @mouseleave.prevent="dragend"
                >
                    <ArcShortest
                        v-if="typeOfScheme == schemeType.analog"
                        :start="bgCircle.color.h"
                        :end="accentCircle.color.h"
                    />
                    <ArcShortest
                        v-if="typeOfScheme == schemeType.analog"
                        :start="accentCircle.color.h"
                        :end="secondaryCircle.color.h"
                    />
                    <CircleInput
                        :coords="accentCircle"
                        accent
                        @drag-start="(e) => dragstart(accentCircle, e)"
                    />
                    <CircleInput
                        :coords="secondaryCircle"
                        @drag-start="(e) => dragstart(secondaryCircle, e)"
                        v-if="show3Circles"
                    />
                    <CircleInput
                        :coords="bgCircle"
                        @drag-start="(e) => dragstart(bgCircle, e)"
                        v-if="show2Circles"
                    />
                    <circle
                        :r="(inputAccentC * WHEEL_SVG_WIDTH * SCALE) / 100"
                        :cx="WHEEL_SVG_WIDTH / 2"
                        :cy="WHEEL_SVG_WIDTH / 2"
                        fill="none"
                        stroke="black"
                        stroke-width="2"
                    />
                    <circle
                        :r="(inputBgC * WHEEL_SVG_WIDTH * SCALE) / 100"
                        :cx="WHEEL_SVG_WIDTH / 2"
                        :cy="WHEEL_SVG_WIDTH / 2"
                        fill="none"
                        stroke="black"
                        stroke-width="2"
                    />
                </svg>
            </div>
        </div>

        <!--<MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" /> --><!--TODO оно зависает-->

        <MockupEditor :colorsLight="generatedNewLight" :colorsDark="generatedNewDark" />
    </div>
</template>
<style scoped>
.color-wheel-svg {
    background-image: url('@/assets/color-wheel.png');
    background-size: cover;
}

.generator-wheel-page {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-evenly;
}

.harmony-type-button {
    flex-grow: 0;
    padding: 1rem;
    background: none;

    display: flex;
    flex-flow: column nowrap;
    align-items: center;
}

.chroma-params {
    padding: 1.2rem 0px;
    p {
        margin: 0px 0px 0.6rem;
    }
    div {
        align-items: center;
    }
    label {
        width: 5.5rem;
    }
}

.color-wheel-square {
    position: relative;
}

.color-wheel-square-reverse {
    position: absolute;
    top: 0px;
    right: 0px;
}

.color-wheel-square-base-color {
    position: absolute;
    bottom: 0px;
    right: 0px;
}

.color-wheel-square-base-h {
    position: absolute;
    top: 0px;
    left: 0px;
}
</style>
