<script setup lang="ts">
import InputNumber from '@/InputNumber.vue';
import { computed } from 'vue';

const model = defineModel<number>({ required: true });

const props = defineProps<{
    min: number;
    max: number;
    circle?: boolean;
    gradient: string;
    id: string;
    label: string;
    width?: number;
}>();

const widthCorrected = computed(() => (props.width ? props.width : 0.001));
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
                class="input-range-color input-range-gradient"
                :class="{ 'input-range-color-width': width !== undefined }"
            />
        </div>
        <InputNumber v-model="model" :min="min" :max="max" :step="1" :circle="circle" />
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

    background-image: v-bind(gradient);
}

.input-range-color-width {
    --width: v-bind(widthCorrected);

    --circle: calc((2 * var(--border)) + var(--height-thumb));
    width: calc(var(--circle) + (var(--width) * (100% - var(--circle))));
}
</style>
