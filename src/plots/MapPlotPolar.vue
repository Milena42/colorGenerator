<script setup lang="ts">
import type { Color } from '@/generator/common';
import { SHOW_QUANTITY_ON_PLOTS } from '@/injectionKeys';
import type { Data } from 'plotly.js';
import Plotly from 'plotly.js-dist';
import { inject, onMounted, ref, useTemplateRef, watch } from 'vue';

const props = defineProps<{
    k: number;
    data: Map<string, Color>;
    totalQ: number;
}>();

const showQuantity = inject(SHOW_QUANTITY_ON_PLOTS) ?? ref(true);
const defaultSizeOfPoint = 5;

const graphDiv = useTemplateRef<HTMLElement>('graphDiv');

function createCylindricalGrid(radius: number[], heights: number[]) {
    let grid: Data[] = [];

    for (const h of heights) {
        grid = grid.concat(createRays(h));
        for (const r of radius) {
            grid.push(createCircle(r, h));
        }
    }

    grid.push({
        x: [0, 0],
        y: [0, 0],
        z: [0, 100],
        type: 'scatter3d',
        mode: 'lines',
        line: {
            color: 'gray',
            width: 1,
        },
        showlegend: false,
        hoverinfo: 'none',
    });
    grid.push(createVertical());

    return grid;
}

function createVertical(): Data {
    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];

    const radius = [40];
    for (let angle = 0; angle < 360; angle += 45) {
        const angleRad = (angle * Math.PI) / 180;
        for (const r of radius) {
            x.push(r * Math.cos(angleRad));
            y.push(r * Math.sin(angleRad));
            z.push(0);

            x.push(r * Math.cos(angleRad));
            y.push(r * Math.sin(angleRad));
            z.push(100);

            x.push(NaN); // Разрыв для Plotly
            y.push(NaN);
            z.push(NaN);
        }
    }
    return {
        x: x,
        y: y,
        z: z,
        type: 'scatter3d',
        mode: 'lines',
        line: { color: 'gray', width: 1 },
        showlegend: false,
        hoverinfo: 'none',
    };
}

function createCircle(r: number, h: number): Data {
    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];

    for (let i = 0; i < 360; i += 1) {
        const angleRad = (i * Math.PI) / 180;
        x.push(r * Math.cos(angleRad));
        y.push(r * Math.sin(angleRad));
        z.push(h);
    }
    return {
        x: x,
        y: y,
        z: z,
        type: 'scatter3d',
        mode: 'lines',
        line: { color: 'gray', width: 1 },
        showlegend: false,
        hoverinfo: 'none',
    };
}
function createRays(h: number) {
    const axesTraces: Data[] = [];

    for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const x = 42 * Math.cos(rad);
        const y = 42 * Math.sin(rad);

        axesTraces.push({
            x: [0, x],
            y: [0, y],
            z: [h, h],
            type: 'scatter3d',
            mode: 'lines',
            line: { color: 'gray', width: 1 },
            showlegend: false,
            hoverinfo: 'none',
        });
    }
    return axesTraces;
}

const radius = [10, 20, 30, 40];
const heights = [0, 50, 100];

const gridData = createCylindricalGrid(radius, heights);

function draw() {
    if (!graphDiv.value) return;

    const data = props.data;
    const x = Array.from(data.values(), (v) => v.x);
    const y = Array.from(data.values(), (v) => v.y);
    const z = Array.from(data.values(), (v) => v.l);
    const colors = Array.from(data.keys());

    let sizes;
    if (showQuantity.value) {
        sizes = Array.from(data.values(), (v) => props.k * Math.sqrt((100 * v.q) / props.totalQ));
    } else {
        sizes = defaultSizeOfPoint;
    }

    const traces: Data[] = [
        ...gridData,
        {
            x,
            y,
            z,
            mode: 'markers',
            type: 'scatter3d',
            marker: {
                size: sizes,
                sizemode: 'area',
                color: colors,
                line: {
                    width: 0,
                },
                opacity: 1,
            },
        },
    ];

    const layout = {
        scene: {
            xaxis: {
                range: [-40, 40],
                visible: false,
                showgrid: false,
            },
            yaxis: {
                range: [-40, 40],
                visible: false,
                showgrid: false,
            },
            zaxis: {
                range: [0, 100],
                visible: false,
                showgrid: false,
            },
            aspectratio: {
                x: 0.8,
                y: 0.8,
                z: 1,
            },
        },
        margin: { l: 0, r: 0, t: 0, b: 0 },
    };

    Plotly.newPlot(graphDiv.value, traces, layout);
}

onMounted(draw);

watch(() => props.data, draw, { flush: 'post' });
watch(showQuantity, draw, { flush: 'post' });
</script>
<template>
    <div ref="graphDiv" class="plot"></div>
</template>
