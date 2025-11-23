<script lang="ts">
export class circleObject {
    cx = 0;
    cy = 0;
    svgSquareWidth: number;

    constructor(color: Color, svgSquareWidth: number) {
        this.color = color;
        this.svgSquareWidth = svgSquareWidth;

        //this.rgb = this.color.adjustForRGB();
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
        //this.calculateCoords();//TODO задаем максимальную насыщенность и тон для акцента. Оно не должно сдвигаться, потому что светлота возможно сейчас не та, а максимум насыщенности у всех тонов на разной светлоте. Исправить сдвиг? Мб отдельно задавать С для инпута и С для показа цвета? Мб задавать С отдельным ползунком (удобнее, не будешь задевать тон, а то там конечно можно хоткеи придумать...)
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
    <line :x1="circleObj.svgSquareWidth / 2" :y1="circleObj.svgSquareWidth / 2" :x2="circleObj.cx" :y2="circleObj.cy"
        stroke="black" stroke-width="2" />
    <circle :cx="circleObj.cx" :cy="circleObj.cy" :r="10" :fill="circleObj.rgb" stroke="black" stroke-width="2"
        @mousedown="$emit('drag-start', $event)" />
</template>