<script setup lang="ts">
import {
    circleObject,
    R_SPECTRAL_CIRCLE,
    WHEEL_SVG_WIDTH,
} from '@/generatorFromWheelPage/CircleInput.vue';
import chroma from 'chroma-js';
import { ref, useTemplateRef } from 'vue';

const canvas = useTemplateRef<HTMLCanvasElement>('drawing');
const ctx = ref<CanvasRenderingContext2D>();
const brush = new circleObject(0);

function drawOklchModel() {
    if (canvas.value == null) return;
    ctx.value = canvas.value.getContext('2d') ?? undefined;
    if (ctx.value == undefined) return;
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

    const pixel = 1; // задает гладкость изображения (1 - идеально, но медленно)

    ///////////////////////////////////////////////
    /// спектр

    const maxSaturatedForH: string[] = Array(360 * 2);

    function addColor(r: number, g: number, b: number) {
        const color = chroma.rgb(r, g, b);
        const hOklch = Math.round(color.get('oklch.h') * 2);
        maxSaturatedForH[hOklch] = color.hex('rgb');
    }

    //перебор насыщенных ребер куба
    for (let i = 0; i < 256; i++) {
        addColor(i, 0, 255);
        addColor(i, 255, 0);
        addColor(0, i, 255);
        addColor(255, i, 0);
        addColor(0, 255, i);
        addColor(255, 0, i);
    }

    //заполнение undefined ближайшими
    let leftIndex: number | undefined = undefined;
    if (leftIndex === undefined) {
        for (let i = maxSaturatedForH.length; i >= 0; i--) {
            if (maxSaturatedForH[i] !== undefined) {
                leftIndex = i;
                break;
            }
        }
    }

    let rightIndex: number | undefined = undefined;

    for (let i = 0; i < maxSaturatedForH.length; i++) {
        if (maxSaturatedForH[i] === undefined) {
            if (rightIndex === undefined) {
                for (let k = i + 1; k < maxSaturatedForH.length; k++) {
                    if (maxSaturatedForH[k] !== undefined) {
                        rightIndex = k;
                        break;
                    }
                }
            }

            if (rightIndex !== undefined && leftIndex !== undefined) {
                if (i - leftIndex <= rightIndex - i) {
                    maxSaturatedForH[i] = maxSaturatedForH[leftIndex];
                } else {
                    maxSaturatedForH[i] = maxSaturatedForH[rightIndex];
                }
            }
        } else {
            leftIndex = i;
            rightIndex = undefined;
        }
    }
    //завершено заполнение undefined ближайшими

    console.log(maxSaturatedForH);

    for (let i = 0; i < WHEEL_SVG_WIDTH; i += pixel) {
        for (let j = 0; j < WHEEL_SVG_WIDTH; j += pixel) {
            brush.cx = i;
            brush.cy = j;
            brush.calculateColorCoords();
            const r = brush.color.c;

            if (R_SPECTRAL_CIRCLE - 3 <= r && r <= R_SPECTRAL_CIRCLE + 3) {
                const h = Math.round(brush.color.h * 2);
                ctx.value.fillStyle = maxSaturatedForH[h];
                ctx.value.fillRect(i, j, pixel, pixel);
            }
        }
    }

    smoothCircle();

    /////////////////////////////////////////////
    /// меш oklch

    for (let i = 0; i < WHEEL_SVG_WIDTH; i += pixel) {
        for (let j = 0; j < WHEEL_SVG_WIDTH; j += pixel) {
            brush.cx = i;
            brush.cy = j;
            brush.calculateColorCoords();
            const c = brush.color.c;
            const h = brush.color.h;

            for (let l = 100; l >= 40; l -= pixel) {
                const pointToRgb = chroma.oklch(l / 100, c / 100, h);
                if (!pointToRgb.clipped()) {
                    ctx.value.fillStyle = pointToRgb.hex();
                    ctx.value.fillRect(i, j, pixel, pixel);
                    break;
                }
            }
        }
    }
}

function smoothCircle() {
    if (canvas.value == null) return;
    if (ctx.value == undefined) return;

    ctx.value.beginPath();

    ctx.value.strokeStyle = 'black';
    ctx.value.globalCompositeOperation = 'destination-in';

    brush.cx = WHEEL_SVG_WIDTH / 2;
    brush.cy = 5;
    brush.calculateColorCoords();
    brush.color.c = R_SPECTRAL_CIRCLE;
    brush.calculateCoords();
    const radius = WHEEL_SVG_WIDTH / 2 - brush.cy;

    brush.color.c = R_SPECTRAL_CIRCLE + 3;
    brush.calculateCoords();
    ctx.value.lineWidth = (WHEEL_SVG_WIDTH / 2 - brush.cy - radius) * 2 - 2;

    ctx.value.arc(WHEEL_SVG_WIDTH / 2, WHEEL_SVG_WIDTH / 2, radius, 0, 2 * Math.PI);
    ctx.value.stroke();

    ctx.value.globalCompositeOperation = 'source-over';
}
</script>

<template>
    <button @click="drawOklchModel">draw</button>
    <canvas ref="drawing" :width="WHEEL_SVG_WIDTH" :height="WHEEL_SVG_WIDTH"></canvas>
</template>
