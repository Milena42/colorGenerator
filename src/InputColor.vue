<script lang="ts">
export function round(n: number) {
    return parseFloat(n.toFixed(2));
}
</script>
<script setup lang="ts">
import chroma from 'chroma-js';
import { computed } from 'vue';
import InputColorHSB from './InputColorHSB.vue';
import InputColorOKLCH from './InputColorOKLCH.vue';
import type { Color } from './model/myTypes';

const color = defineModel<Color>({ required: true });

const colorHex = computed({
    get: () => color.value.adjustForRGB(),
    set: (v) => {
        const [l, c, h] = chroma(v).oklch();
        if (l) color.value.l = round(l * 100);
        if (c) color.value.c = round(c * 100);
        if (h) color.value.h = round(h);
    },
});
</script>
<template>
    <div>
        <div class="input-color" :style="{ backgroundColor: colorHex }"></div>
        <div class="row">
            <InputColorHSB v-model="colorHex" />
            <InputColorOKLCH v-model="color" />
        </div>
    </div>
</template>
<style scoped>
.input-color {
    height: 2rem;
    width: 3rem;
}
</style>
