<script lang="ts">
export const R_SPECTRAL_CIRCLE = 37;
export const WHEEL_SVG_WIDTH = 450;
export const SCALE = 1.22;
export class circleObject {
    cx = 0;
    cy = 0;

    constructor(h: number) {
        this.color = new Color(50, { c: R_SPECTRAL_CIRCLE, h: h });
        this.calculateCoords();
    }

    color: Color;

    calculateCoords() {
        this.cx = (this.color.x * WHEEL_SVG_WIDTH * SCALE) / 100 + WHEEL_SVG_WIDTH / 2;
        this.cy = (-this.color.y * WHEEL_SVG_WIDTH * SCALE) / 100 + WHEEL_SVG_WIDTH / 2;
    }

    calculateColorCoords() {
        this.color.x = ((this.cx - WHEEL_SVG_WIDTH / 2) * 100) / WHEEL_SVG_WIDTH / SCALE;
        this.color.y = -((this.cy - WHEEL_SVG_WIDTH / 2) * 100) / WHEEL_SVG_WIDTH / SCALE;
    }
}

export interface circleDisplay {
    cx: number;
    cy: number;
}
</script>

<script setup lang="ts">
import { Color } from '@/model/myTypes';
import { computed } from 'vue';

defineEmits(['drag-start']);
const props = defineProps<{
    coords: circleDisplay;
    accent?: boolean;
    title: string;
}>();

const lineOpacity = computed(() => {
    return props.accent ? 1 : 0.5;
});
</script>
<template>
    <g>
        <line
            :x1="WHEEL_SVG_WIDTH / 2"
            :y1="WHEEL_SVG_WIDTH / 2"
            :x2="coords.cx"
            :y2="coords.cy"
            stroke="black"
            :stroke-opacity="lineOpacity"
            stroke-width="2"
        />
        <title>{{ title }}</title>
        <circle
            :cx="coords.cx"
            :cy="coords.cy"
            :r="10"
            fill="rgba(0,0,0,0)"
            stroke="black"
            :stroke-opacity="lineOpacity"
            stroke-width="2"
            @mousedown.prevent="$emit('drag-start', $event)"
        />
    </g>
</template>
