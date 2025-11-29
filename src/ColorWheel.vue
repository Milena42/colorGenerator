<script setup lang="ts">
import chroma from 'chroma-js';
import { computed, reactive, useTemplateRef } from 'vue';
import CircleInput, { circleObject } from './CircleInput.vue';
import { Color, type schemeType } from './myTypes';

const props = defineProps<{
    typeOfScheme: schemeType,
}>();


const accent = defineModel<Color>('accent', { required: true });
const accentChroma = defineModel<number>('accentChroma', { required: true });
const bgChroma = defineModel<number>('bgChroma', { required: true });

const secondary = defineModel<Color>('secondary', { required: true });
const bg = defineModel<Color>('bg', { required: true });


const svgSquareWidth = 500;

const accentCircle = reactive(new circleObject(accent.value, svgSquareWidth));
const secondaryCircle = reactive(new circleObject(secondary.value, svgSquareWidth));
const bgCircle = reactive(new circleObject(bg.value, svgSquareWidth));

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
};

const hRangeBg = computed<[number, number]>(() => {
    return [(accentCircle.color.h + 120) % 360, (accentCircle.color.h + 120 + 120) % 360];
});//TODO  типа этого проверка вдруг диапазон подходит при переключении селекта

function mousemove(event: MouseEvent) {
    if (!draggedCircle) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    draggedCircle.cx = initialCircleX + deltaX;
    draggedCircle.cy = initialCircleY + deltaY;

    const oldH = draggedCircle.color.h;
    draggedCircle.calculateColorCoords();

    const currentH = draggedCircle.color.h;
    const accentH = accentCircle.color.h;
    if (draggedCircle === accentCircle) {
        const dH = currentH - oldH;
        bgCircle.color.h = (bgCircle.color.h + dH + 360) % 360;
        bgCircle.calculateCoords();
        secondaryCircle.color.h = (secondaryCircle.color.h + dH + 360) % 360;
        secondaryCircle.calculateCoords();
    } else if (draggedCircle === bgCircle) {
        if (props.typeOfScheme == "complementary") {
            draggedCircle.color.h = oldH;
        }
        else {
            secondaryCircle.color.h = (2 * accentH - currentH + 360) % 360;
            secondaryCircle.calculateCoords();
        }
    } else if (draggedCircle === secondaryCircle) {
        bgCircle.color.h = (2 * accentH - currentH + 360) % 360;
        bgCircle.calculateCoords();
    }

    draggedCircle.color.c = 20;
    draggedCircle.calculateCoords();
};

function dragend() {
    draggedCircle = undefined;
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

const show2Circles = computed(() => {
    return props.typeOfScheme != "mono";
});
const show3Circles = computed(() => {
    return props.typeOfScheme != "mono" && props.typeOfScheme != "complementary";
})

</script>
<template>
    <button @click="drawOklchModel">нарисовать фон</button>
    <div class="temp">
        <canvas ref="drawing" :width="svgSquareWidth" :height="svgSquareWidth"></canvas>
        <svg version="1.1" :width="svgSquareWidth" :height="svgSquareWidth" ref="svg" xmlns="http://www.w3.org/2000/svg"
            style="border:1px solid black" @mousemove="mousemove" @mouseup="dragend" @mouseleave="dragend">
            <CircleInput :circle-obj="accentCircle" accent @drag-start="(e) => dragstart(accentCircle, e)" />
            <CircleInput :circle-obj="secondaryCircle" @drag-start="(e) => dragstart(secondaryCircle, e)"
                v-if="show3Circles" />
            <CircleInput :circle-obj="bgCircle" @drag-start="(e) => dragstart(bgCircle, e)" v-if="show2Circles" />
            <circle :r="accentChroma * svgSquareWidth / 100" :cx="svgSquareWidth / 2" :cy="svgSquareWidth / 2" fill="none"
                stroke="black" stroke-width="2" />
            <circle :r="bgChroma * svgSquareWidth / 100" :cx="svgSquareWidth / 2" :cy="svgSquareWidth / 2" fill="none"
                stroke="black" stroke-width="2" />
        </svg>
    </div>
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