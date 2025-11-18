<script setup lang="ts">
import chroma from 'chroma-js';
import { reactive, ref, useTemplateRef } from 'vue';
import CircleInput, { circleObject } from './CircleInput.vue';
import { Color } from './myTypes';


const accent = defineModel<Color>('accent');


const svgSquareWidth = 500;

const circle1 = reactive(new circleObject(accent.value ?? new Color(40, { c: 0, h: 0 }), svgSquareWidth));


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

const inputL = ref(accent.value?.l ?? 50);
function changeL() {
    circle1.color.l = inputL.value;
    circle1.calculateColor();
}


const canvas = useTemplateRef<HTMLCanvasElement>("drawing");

function drawOklchModel() {
    if (!canvas.value) {
        console.log("canvas отсутствует");
        return;
    }
    const ctx = canvas.value.getContext("2d");
    if (!ctx) {
        console.log("проблемы с контекстом canvas");
        return;
    }
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    const brush = new circleObject(new Color(0, { x: 0, y: 0 }), svgSquareWidth);

    const pixel = 4; // задает гладкость изображения (1 - идеально, но медленно)
    for (let l = 0; l < 100; l += pixel) {
        for (let i = 0; i < svgSquareWidth; i += pixel) {
            for (let j = 0; j < svgSquareWidth; j += pixel) {
                brush.cx = i;
                brush.cy = j;
                brush.calculateColorCoords();
                const c = brush.color.c;
                const h = brush.color.h;
                const pointToRgb = chroma.oklch(l / 100, c / 100, h);
                if (!pointToRgb.clipped()) {
                    ctx.fillStyle = pointToRgb.hex();
                    ctx.fillRect(i, j, pixel, pixel);
                }

            }
        }
    }
}

</script>
<template>
    <button @click="drawOklchModel">нарисовать фон</button>
    <div class="temp">
        <canvas ref="drawing" :width="svgSquareWidth" :height="svgSquareWidth"></canvas>
        <svg version="1.1" :width="svgSquareWidth" :height="svgSquareWidth" ref="svg" xmlns="http://www.w3.org/2000/svg"
            style="border:1px solid black" @mousemove="mousemove" @mouseup="dragend" @mouseleave="dragend">
            <CircleInput :circle-obj="circle1" @drag-start="(e) => dragstart(circle1, e)" />
        </svg>
    </div>
    <input v-model="inputL" @change="changeL" type="range" min="0" max="100" />
</template>
<style scoped>
.temp {
    position: relative;

    svg {
        position: absolute;
        top: 0px;
        left: 0px;
    }
}
</style>