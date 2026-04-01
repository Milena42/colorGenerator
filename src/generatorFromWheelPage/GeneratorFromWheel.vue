<script setup lang="ts">
import IconAnalog from '@/assets/icons/colorSchemes/IconAnalog.vue';
import IconComplementary from '@/assets/icons/colorSchemes/IconComplementary.vue';
import IconMono from '@/assets/icons/colorSchemes/IconMono.vue';
import IconTriad from '@/assets/icons/colorSchemes/IconTriad.vue';
import { vOnClickOutside } from '@vueuse/components';
import { computed, reactive, ref, shallowRef, watch, type ShallowRef } from 'vue';
import CircleInput, {
    circleObject,
    R_SPECTRAL_CIRCLE,
    SCALE,
    WHEEL_SVG_WIDTH,
} from './CircleInput.vue';

//import MapPlot3d from './MapPlot3d.vue';
import IconSwap from '@/assets/icons/IconSwap.vue';
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
            return inputDarkH.value;
        },
    ],
    [
        schemeType.analog,
        (l) => {
            return (
                ((2 * hMinus(inputLightH.value, inputAccentH.value) * (l - 50)) / 100 +
                    inputAccentH.value +
                    360) %
                360
            );
        },
    ],
    [
        schemeType.triad,
        (l) => {
            if (l < 35) return inputDarkH.value;
            if (l <= 80) return inputAccentH.value;
            return inputLightH.value;
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
const lightCircle = reactive(new circleObject(0));
const darkCircle = reactive(new circleObject(0));

const inputAccentH = computed({
    get: () => accentCircle.color.h,
    set: (v) => {
        accentCircle.color.h = v;
    },
});
const inputLightH = computed({
    get: () => lightCircle.color.h,
    set: (v) => {
        lightCircle.color.h = v;
    },
});
const inputDarkH = computed({
    get: () => darkCircle.color.h,
    set: (v) => {
        darkCircle.color.h = v;
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

watch([inputAccentH, inputDarkH, inputLightH], generate, { immediate: true });

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
            inputDarkH.value = (accentH + 180) % 360;
            break;
        case 'analog':
            inputDarkH.value = (accentH + 60) % 360;
            inputLightH.value = (accentH - 60 + 360) % 360;
            break;
        case 'triad':
            inputDarkH.value = (accentH + 120) % 360;
            inputLightH.value = (accentH - 120 + 360) % 360;
            break;
        default:
            break;
    }
    darkCircle.calculateCoords();
    lightCircle.calculateCoords();
    generate();
}

watch(typeOfScheme, changeTypeOfScheme);

const lockSymmetry = ref(true);

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
        darkCircle.color.h = (darkCircle.color.h + dH + 360) % 360;
        darkCircle.calculateCoords();
        lightCircle.color.h = (lightCircle.color.h + dH + 360) % 360;
        lightCircle.calculateCoords();
    } else if (lockSymmetry.value) {
        if (draggedCircle === darkCircle) {
            if (typeOfScheme.value == 'complementary') {
                draggedCircle.color.h = oldH;
            } else {
                lightCircle.color.h = (2 * accentH - currentH + 360) % 360;
                lightCircle.calculateCoords();
            }
        } else if (draggedCircle === lightCircle) {
            darkCircle.color.h = (2 * accentH - currentH + 360) % 360;
            darkCircle.calculateCoords();
        }
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
    [inputDarkH.value, inputLightH.value] = [inputLightH.value, inputDarkH.value];
    darkCircle.calculateCoords();
    lightCircle.calculateCoords();
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
                    title="аналоговая (из градиента)"
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
                <div class="color-wheel-square-reverse">
                    <button
                        @click="reverseDependentHues"
                        v-if="show3Circles"
                        title="поменять местами зависимые тона"
                    >
                        <IconSwap />
                    </button>
                    <button
                        @click="lockSymmetry = !lockSymmetry"
                        v-if="show2Circles"
                        title="блокировка симметрии"
                    >
                        с
                    </button>
                </div>

                <div class="color-wheel-square-base-h" title="акцентный тон">
                    <InputNumber v-model.lazy.number="baseH" :min="0" :max="360" :step="1" circle />
                </div>

                <div class="color-wheel-square-base-color">
                    <button
                        v-if="!inputHFromColor"
                        @click="inputHFromColor = true"
                        title="задать акцентный тон на основе цвета"
                        class="text-button"
                    >
                        Из цвета
                    </button>
                    <InputColorHString
                        v-if="inputHFromColor"
                        v-model.lazy="baseH"
                        @change="inputHFromColor = false"
                        v-on-click-outside="() => (inputHFromColor = false)"
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
                        :start="darkCircle.color.h"
                        :end="accentCircle.color.h"
                    />
                    <ArcShortest
                        v-if="typeOfScheme == schemeType.analog"
                        :start="accentCircle.color.h"
                        :end="lightCircle.color.h"
                    />
                    <CircleInput
                        :coords="accentCircle"
                        accent
                        title="акцентный тон"
                        @drag-start="(e) => dragstart(accentCircle, e)"
                    />
                    <CircleInput
                        :coords="lightCircle"
                        title="светлые"
                        @drag-start="(e) => dragstart(lightCircle, e)"
                        v-if="show3Circles"
                    />
                    <CircleInput
                        :coords="darkCircle"
                        title="темные"
                        @drag-start="(e) => dragstart(darkCircle, e)"
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
