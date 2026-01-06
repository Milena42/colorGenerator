<script lang="ts">
export const WHEEL_SVG_WIDTH = 450;
export const SCALE = 1.22;
export class circleObject {
    cx = 0;
    cy = 0;

    constructor(color: Color) {
        this.color = color;

        //this.rgb = this.color.adjustForRGB();
        this.calculateCoords();
    }

    color: Color;

    calculateCoords() {
        this.cx = (this.color.x * WHEEL_SVG_WIDTH * SCALE) / 100 + WHEEL_SVG_WIDTH / 2;
        this.cy = (this.color.y * WHEEL_SVG_WIDTH * SCALE) / 100 + WHEEL_SVG_WIDTH / 2;
    }
    calculateColorCoords() {
        this.color.x = ((this.cx - WHEEL_SVG_WIDTH / 2) * 100) / WHEEL_SVG_WIDTH / SCALE;
        this.color.y = ((this.cy - WHEEL_SVG_WIDTH / 2) * 100) / WHEEL_SVG_WIDTH / SCALE;
    }
    calculateColor() {
        this.calculateColorCoords();
        this.rgb = this.color.adjustForRGB();
        //this.calculateCoords();//TODO задаем максимальную насыщенность и тон для акцента. Оно не должно сдвигаться, потому что светлота возможно сейчас не та, а максимум насыщенности у всех тонов на разной светлоте. Исправить сдвиг? Мб отдельно задавать С для инпута и С для показа цвета? Мб задавать С отдельным ползунком (удобнее, не будешь задевать тон, а то там конечно можно хоткеи придумать...)
    }

    rgb = '#fff';
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { Color } from './model/myTypes';

defineEmits(['drag-start']);
const props = defineProps<{
    circleObj: circleObject;
    accent?: boolean;
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
            :x2="circleObj.cx"
            :y2="circleObj.cy"
            stroke="black"
            :stroke-opacity="lineOpacity"
            stroke-width="2"
        />
        <circle
            :cx="circleObj.cx"
            :cy="circleObj.cy"
            :r="10"
            fill="rgba(0,0,0,0)"
            stroke="black"
            :stroke-opacity="lineOpacity"
            stroke-width="2"
            @mousedown="$emit('drag-start', $event)"
        />
    </g>
</template>
