<script setup lang="ts">
import type { Data } from 'plotly.js';
import Plotly from 'plotly.js-dist';
import { inject, onMounted, ref, useTemplateRef, watch, type Ref } from 'vue';
import type { Color } from './myTypes';

const props = defineProps<{
    k: number;
    data: Map<string, Color>;
    totalQ: number;
}>();

const showQuantity: Ref<boolean> = inject('showQuantityOnPlots') ?? ref(true);
const defaultSizeOfPoint = 5;

const graphDiv = useTemplateRef<HTMLElement>('graphDiv');

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
            },
            yaxis: {
                range: [-40, 40],
            },
            zaxis: {
                range: [0, 100],
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
