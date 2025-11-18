<script lang="ts">
export class circleObject {
    cx = 0;
    cy = 0;
    svgSquareWidth: number;

    constructor(color: Color, svgSquareWidth: number) {
        this.color = color;
        this.svgSquareWidth = svgSquareWidth;

        this.rgb = this.color.adjustForRGB();
        this.calculateCoords();
    }

    color: Color;

    calculateCoords() {
        this.cx = this.color.x * this.svgSquareWidth / 100 + this.svgSquareWidth / 2;
        this.cy = this.color.y * this.svgSquareWidth / 100 + this.svgSquareWidth / 2;
    }
    calculateColorCoords() {
        this.color.x = (this.cx - this.svgSquareWidth / 2) * 100 / this.svgSquareWidth;
        this.color.y = (this.cy - this.svgSquareWidth / 2) * 100 / this.svgSquareWidth;
    }
    calculateColor() {
        this.calculateColorCoords();
        this.rgb = this.color.adjustForRGB();
        //this.calculateCoords();
    }

    rgb = "#fff";

}
</script>


<script setup lang="ts">
import { Color } from './myTypes';

defineEmits(['drag-start']);
defineProps<{
    circleObj: circleObject;
}>();

</script>
<template>
    <circle :cx="circleObj.cx" :cy="circleObj.cy" :r="10" :fill="circleObj.rgb" stroke="black" stroke-width="2"
        @mousedown="$emit('drag-start', $event)" />
</template>