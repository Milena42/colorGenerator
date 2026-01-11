<script setup lang="ts">
import { computed } from 'vue';
import InputNumber from './InputNumber.vue';

const model = defineModel<number>({ required: true });

const props = defineProps<{
    min: number;
    max: number;
    gradient?: string;
    gradientBorders?: { min: string; max: string };
    id: string;
    label: string;
    width?: number;
}>();

const cssGradient = computed(() => {
    if (props.gradient) return props.gradient;
    if (props.gradientBorders)
        return `linear-gradient(to right, ${props.gradientBorders.min},${props.gradientBorders.max})`;
    return '';
});

const widthCorrected = computed(() => (props.width ? props.width : 0));
</script>

<template>
    <div class="input-range-color-line">
        <label :for="id">{{ label }}</label>
        <div class="input-range-color-container">
            <input
                type="range"
                v-model.number="model"
                :min="min"
                :max="max"
                :step="0.01"
                :id="id"
                class="input-range-color"
                :class="{ 'input-range-color-width': width }"
            />
        </div>
        <InputNumber v-model="model" :min="min" :max="max" :step="1" />
    </div>
</template>

<style scoped>
.input-range-color-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-start;

    label {
        flex-grow: 0;
        flex-shrink: 0;
        width: 1rem;
        text-align: center;
    }

    .input-number {
        margin-left: auto;
    }
}

.input-range-color-container {
    flex: 1 1 0;
    align-self: stretch;
    display: flex;
    align-items: center;
}

.input-range-color {
    -webkit-appearance: none;
    appearance: none;

    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    margin: 0px;

    --height: 1.5rem;
    --height-thumb: calc(var(--height) * 0.7);
    height: var(--height);
    border-radius: calc(var(--height) / 2);
    border: none;
    --border: 2px;

    background: v-bind(cssGradient);

    &::-moz-range-thumb {
        width: var(--height-thumb);
        height: var(--height-thumb);
        border-radius: 50%;
        background: none;
        border: var(--border) solid white;
        cursor: pointer;
        box-sizing: content-box;
    }

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;

        /* намеренное дублирование: chrome игнорирует, если объединить */

        width: var(--height-thumb);
        height: var(--height-thumb);
        border-radius: 50%;
        background: none;
        border: var(--border) solid white;
        cursor: pointer;
        box-sizing: content-box;
    }
}

.input-range-color-width {
    --width: v-bind(widthCorrected);

    --circle: calc((2 * var(--border)) + var(--height-thumb));
    width: calc(var(--circle) + (var(--width) * (100% - var(--circle))));
}
</style>
