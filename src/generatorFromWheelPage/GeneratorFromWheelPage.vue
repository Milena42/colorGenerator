<script setup lang="ts">
import { setWithTransition } from '@/assets/animation';
import IconAnalog from '@/assets/icons/colorSchemes/IconAnalog.vue';
import IconComplementary from '@/assets/icons/colorSchemes/IconComplementary.vue';
import IconMono from '@/assets/icons/colorSchemes/IconMono.vue';
import IconTriad from '@/assets/icons/colorSchemes/IconTriad.vue';
import IconLockOff from '@/assets/icons/IconLockOff.vue';
import IconLockOn from '@/assets/icons/IconLockOn.vue';
import IconSwap from '@/assets/icons/IconSwap.vue';
import InputColorHString from '@/components/inputColor/InputColorHString.vue';
import InputNumber from '@/components/InputNumber.vue';
import { type MockupColors, type Theme } from '@/generator/common';
import {
    generateFromWheelGradient,
    generateFromWheelMono,
    generateFromWheelStep2,
    generateFromWheelStep3,
    type ChromaParams,
    type SchemeType,
} from '@/generator/generatorFromWheelEngine';
import {
    colorRoles,
    darkTheme,
    lightTheme,
    maxCAccent,
    maxCBg,
    type ColorRole,
} from '@/generator/themesExample';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import { vOnClickOutside } from '@vueuse/components';
import { computed, inject, reactive, ref, watch, type Ref } from 'vue';
import ArcShortest from './ArcShortest.vue';
import CircleInput, {
    circleObject,
    R_SPECTRAL_CIRCLE,
    SCALE,
    WHEEL_SVG_WIDTH,
} from './CircleInput.vue';

const generatedLight = ref<MockupColors<ColorRole>>();
const generatedDark = ref<MockupColors<ColorRole>>();

const accentCircle = reactive(new circleObject(236));
const lightCircle = reactive(new circleObject(0));
const darkCircle = reactive(new circleObject(0));

const inputAccentH = computed({
    get: () => accentCircle.color.h,
    set: (v) => {
        accentCircle.color.h = v;
        accentCircle.calculateCoords();
    },
});
const inputLightH = computed({
    get: () => lightCircle.color.h,
    set: (v) => {
        lightCircle.color.h = v;
        lightCircle.calculateCoords();
    },
});
const inputDarkH = computed({
    get: () => darkCircle.color.h,
    set: (v) => {
        darkCircle.color.h = v;
        darkCircle.calculateCoords();
    },
});

const typeOfScheme = ref<SchemeType>('mono');

const inputBgC = ref<number>(maxCBg);
const inputAccentC = ref<number>(maxCAccent);

const darkThemeModified = inject<Ref<Theme<ColorRole>>>('darkThemeLightness');
const lightThemeModified = inject<Ref<Theme<ColorRole>>>('lightThemeLightness');
watch([darkThemeModified, lightThemeModified], () => {
    generate();
});

function generate() {
    const themeParams = {
        themeKeys: ['dark', 'light'],
        roleKeys: colorRoles,
        themes: {
            dark: darkThemeModified?.value ?? darkTheme,
            light: lightThemeModified?.value ?? lightTheme,
        },
    } as const;

    const chromaParams: ChromaParams = {
        accentC: inputAccentC.value / maxCAccent,
        bgC: inputBgC.value / maxCBg,
    };

    const generatedThemes = (() => {
        switch (typeOfScheme.value) {
            case 'mono':
                return generateFromWheelMono(inputAccentH.value, themeParams, chromaParams);
            case 'step2':
                return generateFromWheelStep2(
                    inputAccentH.value,
                    inputDarkH.value,
                    themeParams,
                    chromaParams,
                );
            case 'step3':
                return generateFromWheelStep3(
                    inputAccentH.value,
                    inputDarkH.value,
                    inputLightH.value,
                    themeParams,
                    chromaParams,
                );
            case 'gradient':
                return generateFromWheelGradient(
                    inputAccentH.value,
                    inputDarkH.value,
                    inputLightH.value,
                    themeParams,
                    chromaParams,
                );
        }
    })();

    generatedDark.value = generatedThemes.dark;
    generatedLight.value = generatedThemes.light;
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

function setTypeOfScheme(newType: SchemeType) {
    typeOfScheme.value = newType;

    const accentH = inputAccentH.value;
    switch (newType) {
        case 'mono':
            break;
        case 'step2':
            inputDarkH.value = (accentH + 180) % 360;
            break;
        case 'gradient':
            inputDarkH.value = (accentH + 60) % 360;
            inputLightH.value = (accentH - 60 + 360) % 360;
            break;
        case 'step3':
            inputDarkH.value = (accentH + 120) % 360;
            inputLightH.value = (accentH - 120 + 360) % 360;
            break;
    }

    lockSymmetry.value = true;
    generate();
}

const lockSymmetry = ref(true);

let draggedCircle: typeof accentCircle | undefined = undefined;
let startX = 0;
let startY = 0;
let initialCircleX = 0;
let initialCircleY = 0;

function dragStart(element: typeof accentCircle, event: PointerEvent) {
    draggedCircle = element;
    startX = event.clientX;
    startY = event.clientY;
    initialCircleX = draggedCircle.cx;
    initialCircleY = draggedCircle.cy;
}

function dragMove(event: PointerEvent) {
    if (!draggedCircle) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    draggedCircle.cx = initialCircleX + deltaX;
    draggedCircle.cy = initialCircleY + deltaY;

    const oldH = draggedCircle.color.h;
    draggedCircle.calculateColorCoords();

    if (lockSymmetry.value) {
        const currentH = draggedCircle.color.h;
        const accentH = accentCircle.color.h;
        const dH = currentH - oldH;

        if (draggedCircle === accentCircle) {
            moveDependent(dH);
        } else if (draggedCircle === darkCircle) {
            if (typeOfScheme.value == 'step2') {
                inputAccentH.value = (inputAccentH.value + dH + 360) % 360;
            } else {
                inputLightH.value = (2 * accentH - currentH + 360) % 360;
            }
        } else if (draggedCircle === lightCircle) {
            inputDarkH.value = (2 * accentH - currentH + 360) % 360;
        }
    }

    draggedCircle.color.c = R_SPECTRAL_CIRCLE;
    draggedCircle.calculateCoords();
}

function dragEnd() {
    draggedCircle = undefined;
}

function moveDependent(dH: number) {
    inputDarkH.value = (inputDarkH.value + dH + 360) % 360;
    inputLightH.value = (inputLightH.value + dH + 360) % 360;
}

const showAtLeast2Circles = computed(() => {
    return typeOfScheme.value != 'mono';
});
const show3Circles = computed(() => {
    return typeOfScheme.value != 'mono' && typeOfScheme.value != 'step2';
});

function reverseDependentHues() {
    const startDark = inputDarkH.value;
    const startLight = inputLightH.value;

    const time = 400;
    setWithTransition(inputDarkH, startLight, time, { circle: true });
    setWithTransition(inputLightH, startDark, time, { circle: true });
}

const inputHFromColor = ref(false);

const baseH = computed({
    get: () => inputAccentH.value,
    set: (v) => {
        const oldH = inputAccentH.value;
        const dH = v - oldH;
        inputAccentH.value = v;
        moveDependent(dH);
    },
});
</script>
<template>
    <div class="generator-wheel-page">
        <div class="generator-wheel-controls">
            <div class="choice-chips">
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == 'mono' }"
                    @click="setTypeOfScheme('mono')"
                    title="монохромная (1 тон)"
                >
                    <IconMono />
                </button>
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == 'step2' }"
                    @click="setTypeOfScheme('step2')"
                    title="комплементарная (2 тона)"
                >
                    <IconComplementary />
                </button>
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == 'gradient' }"
                    @click="setTypeOfScheme('gradient')"
                    title="аналоговая (из градиента)"
                >
                    <IconAnalog />
                </button>
                <button
                    class="harmony-type-button choice-chip"
                    :class="{ current: typeOfScheme == 'step3' }"
                    @click="setTypeOfScheme('step3')"
                    title="триада (3 тона)"
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
                <div class="color-wheel-square-base-h" title="акцентный тон">
                    <InputNumber v-model.lazy.number="baseH" :min="0" :max="360" :step="1" circle />
                </div>

                <div class="color-wheel-square-reverse">
                    <button
                        @click="lockSymmetry = !lockSymmetry"
                        v-if="showAtLeast2Circles && !(typeOfScheme == 'gradient')"
                        :title="`${lockSymmetry ? 'выключить' : 'включить'} блокировку углов`"
                    >
                        <IconLockOff v-if="!lockSymmetry" />
                        <IconLockOn v-if="lockSymmetry" />
                    </button>
                    <button
                        @click="reverseDependentHues"
                        v-if="show3Circles"
                        title="поменять местами зависимые тона"
                    >
                        <IconSwap />
                    </button>
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
                    xmlns="http://www.w3.org/2000/svg"
                    @pointermove.prevent="dragMove"
                    @pointerup.prevent="dragEnd"
                    @pointerleave.prevent="dragEnd"
                >
                    <ArcShortest
                        v-if="typeOfScheme == 'gradient'"
                        :start="darkCircle.color.h"
                        :end="accentCircle.color.h"
                    />
                    <ArcShortest
                        v-if="typeOfScheme == 'gradient'"
                        :start="accentCircle.color.h"
                        :end="lightCircle.color.h"
                    />
                    <CircleInput
                        :coords="accentCircle"
                        accent
                        :title="showAtLeast2Circles ? 'акцентный тон' : 'тон схемы'"
                        @m-drag-start="(e) => dragStart(accentCircle, e)"
                    />
                    <CircleInput
                        :coords="lightCircle"
                        title="светлые"
                        @m-drag-start="(e) => dragStart(lightCircle, e)"
                        v-if="show3Circles"
                    />
                    <CircleInput
                        :coords="darkCircle"
                        :title="show3Circles ? 'темные' : 'фоновые'"
                        @m-drag-start="(e) => dragStart(darkCircle, e)"
                        v-if="showAtLeast2Circles"
                    />
                    <circle
                        class="wheel-svg-controls"
                        :r="(inputAccentC * WHEEL_SVG_WIDTH * SCALE) / 100"
                        :cx="WHEEL_SVG_WIDTH / 2"
                        :cy="WHEEL_SVG_WIDTH / 2"
                        fill="none"
                        stroke="black"
                        stroke-width="2"
                    />
                    <circle
                        class="wheel-svg-controls"
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
        <div class="editor-view-space">
            <div class="editor-view">
                <MockupEditor
                    :colorsLight="generatedLight"
                    :colorsDark="generatedDark"
                    class="editor-view-content"
                    v-if="generatedDark && generatedLight"
                />
            </div>
        </div>
    </div>
</template>
<style>
@media (min-width: 1900px) {
    .generator-wheel-page,
    .mockup-editor {
        flex-flow: row nowrap !important;
    }
}
</style>

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
    gap: var(--adaptive-gap);
}

.generator-wheel-controls {
    width: max-content;

    display: flex;
    flex-flow: column nowrap;
    align-items: stretch;
    justify-content: center;
    gap: calc(var(--adaptive-gap) * 2);
}

@media (min-width: 1000px) and (max-width: 1900px) {
    .generator-wheel-page {
        flex-flow: row nowrap;
        align-items: stretch;
    }
    .editor-view-space {
        position: relative;

        flex: 1 1 0;
    }
    .editor-view {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: auto;
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

.harmony-type-button {
    flex-grow: 0;
    padding: 1rem;
    background: none;

    display: flex;
    flex-flow: column nowrap;
    align-items: center;

    &.current:hover {
        cursor: pointer;
    }
}

.chroma-params {
    p {
        margin: 0px 0px 0.4rem;
    }
    div {
        align-items: center;
        gap: 0.5rem;
    }
    label {
        min-width: 5rem;
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
