<script setup lang="ts">
import IconAnalog from '@/assets/icons/colorSchemes/IconAnalog.vue';
import IconComplementary from '@/assets/icons/colorSchemes/IconComplementary.vue';
import IconMono from '@/assets/icons/colorSchemes/IconMono.vue';
import IconTriad from '@/assets/icons/colorSchemes/IconTriad.vue';
import IconLockOff from '@/assets/icons/IconLockOff.vue';
import IconLockOn from '@/assets/icons/IconLockOn.vue';
import IconSwap from '@/assets/icons/IconSwap.vue';
import InputColorHString from '@/inputColor/InputColorHString.vue';
import InputNumber from '@/InputNumber.vue';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import { type MockupColors } from '@/model/myTypes';
import { darkTheme, lightTheme, maxCAccent, maxCBg } from '@/model/themes';
import { vOnClickOutside } from '@vueuse/components';
import { computed, reactive, ref, watch } from 'vue';
import ArcShortest from './ArcShortest.vue';
import CircleInput, {
    circleObject,
    R_SPECTRAL_CIRCLE,
    SCALE,
    WHEEL_SVG_WIDTH,
} from './CircleInput.vue';
import { generateFromWheel, type SchemeType } from './generatorFromWheelEngine';

const generatedLight = ref<MockupColors>({});
const generatedDark = ref<MockupColors>({});

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

const inputAccentLargeL = ref<number>(darkTheme.accentLarge.l);

function generate() {
    const generatedThemes = generateFromWheel(
        new Map([
            ['dark', darkTheme],
            ['light', lightTheme],
        ]),
        inputAccentC.value,
        inputBgC.value,
        inputAccentH.value,
        inputDarkH.value,
        inputLightH.value,
        typeOfScheme.value,
    );

    generatedDark.value = generatedThemes.get('dark') ?? {};
    generatedLight.value = generatedThemes.get('light') ?? {};
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

watch(inputAccentLargeL, () => {
    const l = inputAccentLargeL.value;
    darkTheme.accentLarge.l = l;
    lightTheme.accentLarge.l = l;

    const textL = l > 70 ? 18 : 98;
    darkTheme.textOnAccent.l = textL;
    lightTheme.textOnAccent.l = textL;

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

function dragend() {
    draggedCircle = undefined;
}

function moveDependent(dH: number) {
    inputDarkH.value = (inputDarkH.value + dH + 360) % 360;
    inputLightH.value = (inputLightH.value + dH + 360) % 360;
}

const show2Circles = computed(() => {
    return typeOfScheme.value != 'mono';
});
const show3Circles = computed(() => {
    return typeOfScheme.value != 'mono' && typeOfScheme.value != 'step2';
});

function reverseDependentHues() {
    [inputDarkH.value, inputLightH.value] = [inputLightH.value, inputDarkH.value];
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
                <div class="row">
                    <label for="accent-lightness">светлота акцента</label>
                    <input
                        v-model.number="inputAccentLargeL"
                        type="range"
                        :min="50"
                        :max="80"
                        :step="0.1"
                        class="input-range"
                        id="accent-lightness"
                    />
                </div>
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
                        v-if="show2Circles && !(typeOfScheme == 'gradient')"
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
                    ref="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    @mousemove.prevent="mousemove"
                    @mouseup.prevent="dragend"
                    @mouseleave.prevent="dragend"
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
        <div class="editor-view">
            <MockupEditor
                :colorsLight="generatedLight"
                :colorsDark="generatedDark"
                class="editor-view-content"
            />
        </div>
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
    gap: 1rem;
}

.generator-wheel-controls {
    padding: 0px 1rem;
    width: max-content;
}

@media (min-width: 1000px) and (max-width: 1900px) {
    .editor-view {
        flex: 1 1 0;
        overflow: scroll;
        border: 2px solid var(--transparent-pale);
        border-radius: var(--radius);
        align-self: stretch;
        max-height: 100vh;

        .editor-view-content {
            width: max-content;
            margin: 1rem auto;
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
    padding: 1.2rem 0px;
    p {
        margin: 0.7rem 0px 0.4rem;
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
