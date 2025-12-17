<script setup lang="ts">
import { type Data, type Layout } from 'plotly.js';
import Plotly from 'plotly.js-dist';
import { onMounted, useTemplateRef, watch } from 'vue';

const props = defineProps<{
    data: number[],
    circle: number,
    borders: number[],
}>();

const graphDiv = useTemplateRef<HTMLElement>("graphDiv");

function draw() {

    if (!graphDiv.value) return;
    const values = props.data;
    const degrees = values.map((v, i) => i);
    const maxValue = Math.max(...values);

    const traces: Data[] = [
        {
            type: 'barpolar',
            r: values,
            theta: degrees,
            width: 1,

        },
        {
            type: 'scatterpolar',
            r: Array(360).fill(props.circle),
            theta: degrees,

            mode: 'lines',
            line: {
                color: 'red',
                width: 1
            },
        },
        {
            type: 'barpolar',
            r: Array(props.borders.length).fill(maxValue),
            theta: props.borders,
            width: 1,
        },
    ];

    const layout: Partial<Layout> = {
        polar: {
            radialaxis: {
                visible: true,
                range: [0, maxValue * 1.1],
                autorange: 'reversed',
            },
            angularaxis: {
                direction: 'counterclockwise'
            }
        },
        showlegend: false
    };

    Plotly.newPlot(graphDiv.value, traces, layout);
}

onMounted(draw);

watch([() => props.borders], draw, { flush: "post" });

</script>
<template>
    <div ref="graphDiv" class="plot"></div>
</template>

<style scoped>
.plot {
    min-width: 500px;
    min-height: 500px;
}
</style>