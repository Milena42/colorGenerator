<script setup lang="ts">
import type { Data } from 'plotly.js';
import Plotly from 'plotly.js-dist';
import { onMounted, useTemplateRef, watch } from 'vue';
import type { ColorInMap } from './myTypes';

const props = defineProps<{
    k: number,
    data: Map<string, ColorInMap>,
    totalQ: number,
}>();

const graphDiv = useTemplateRef<HTMLElement>("graphDiv");

function draw() {
    //console.log("draw1")
    if (!graphDiv.value) return;
    const data = props.data;
    //console.log("draw")

    const x = Array.from(data.values(), (v) => v.x);
    const y = Array.from(data.values(), (v) => v.y);
    const z = Array.from(data.values(), (v) => v.l);
    const colors = Array.from(data.keys());
    const sizes = Array.from(data.values(), (v) => (props.k * Math.sqrt(100 * v.q / props.totalQ)));

    const traces: Data[] = [{
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
    }];
    const layout = {
        scene: {
            xaxis: {
                range: [-40, 40]
            },
            yaxis: {
                range: [-40, 40]
            },
            zaxis: {
                range: [0, 100]
            },
            aspectratio: {
                x: 0.8,
                y: 0.8,
                z: 1,
            }
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }

    };
    Plotly.newPlot(graphDiv.value, traces, layout);
    //console.log(traces)
}

onMounted(draw);

watch(() => props.data, draw, { flush: "post" });//TODO тут надо почитать варианты
//скорее всего, оно выполняется до отрисовки компонента, когда еще нет этого дива, надо сразу после появления дива

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