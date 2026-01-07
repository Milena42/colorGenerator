<script setup lang="ts">
import { computed } from 'vue';
import { R_SPECTRAL_CIRCLE, SCALE, WHEEL_SVG_WIDTH } from './CircleInput.vue';
import { cartesianFromPolar } from './utilities/math';

const props = defineProps<{
    start: number;
    end: number;
}>();

const cx = WHEEL_SVG_WIDTH / 2;
const cy = WHEEL_SVG_WIDTH / 2;

const radius = (R_SPECTRAL_CIRCLE * WHEEL_SVG_WIDTH * SCALE) / 100;

const arcPath = computed(() => {
    const [x1, y1] = cartesianFromPolar(radius, props.start);
    const [x2, y2] = cartesianFromPolar(radius, props.end);

    const diffCW = (props.end - props.start + 360) % 360;
    const sweepFlag = diffCW <= 180 ? 1 : 0;

    const largeArcFlag = 0;

    return `M ${x1 + cx} ${y1 + cy} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2 + cx} ${y2 + cy}`;
});
</script>

<template>
    <path :d="arcPath" fill="none" stroke="black" stroke-width="2" stroke-opacity="0.5" />
</template>
