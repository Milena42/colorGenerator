<script setup lang="ts">
import { reactive, ref } from 'vue';
import CircleInput, { circleObject } from './CircleInput.vue';
import { Color } from './myTypes';

const color1 = defineModel<string>('color1');
const color2 = defineModel<string>('color2');
const color3 = defineModel<string>('color3');
const color4 = defineModel<string>('color4');
const color5 = defineModel<string>('color5');
const h = defineModel<number>('h');


const svgSquareWidth = 500;

const circle1 = reactive(new circleObject(new Color(40, { c: 40, h: 40 }), svgSquareWidth));


const draggedCircle = ref<typeof circle1>();
let startX = 0;
let startY = 0;
let initialCircleX = 0;
let initialCircleY = 0;


function dragstart(element: typeof circle1, event: MouseEvent) {
    draggedCircle.value = element;
    startX = event.clientX;
    startY = event.clientY;
    initialCircleX = draggedCircle.value.cx;
    initialCircleY = draggedCircle.value.cy;
};

function mousemove(event: MouseEvent) {
    if (!draggedCircle.value) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    draggedCircle.value.cx = initialCircleX + deltaX;
    draggedCircle.value.cy = initialCircleY + deltaY;
    draggedCircle.value.calculateColor();

};
function dragend() {
    draggedCircle.value = undefined;
}


</script>
<template>
    <div>
        <canvas id="drawing" :width="svgSquareWidth" :height="svgSquareWidth"></canvas>
        <svg version="1.1" :width="svgSquareWidth" :height="svgSquareWidth" ref="svg" xmlns="http://www.w3.org/2000/svg"
            style="border:1px solid black" @mousemove="mousemove" @mouseup="dragend" @mouseleave="dragend">
            <CircleInput :circle-obj="circle1" @drag-start="(e) => dragstart(circle1, e)" />
        </svg>
    </div>
</template>