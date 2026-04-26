<script setup lang="ts">
import { Color } from '@/generator/common';
import chroma from 'chroma-js';
import { computed } from 'vue';
import InputRangeColor from './InputRangeColor.vue';

const color = defineModel<Color>({ required: true });

const borders = computed(() => {
    const { l, h } = color.value;
    const c1 = new Color(l, { c: 40, h });
    const maxCHex = c1.adjustForRGB();
    const maxC = c1.c;
    return {
        maxC,
        c: { min: chroma.oklch(l / 100, 0, h).hex('rgb'), max: maxCHex },
    };
});
</script>
<template>
    <div class="col input-color-components">
        <InputRangeColor
            v-model="color.h"
            label="H"
            id="oklchH"
            gradient="linear-gradient(to right in oklch longer hue, oklch(0.8 0.15 0), oklch(0.8 0.15 360)"
            :min="0"
            :max="360"
            circle
        />
        <InputRangeColor
            v-model="color.c"
            label="C"
            id="oklchC"
            :min="0"
            :max="borders.maxC"
            :width="borders.maxC / 40"
            :gradient-borders="borders.c"
        />
        <InputRangeColor
            v-model="color.l"
            label="L"
            id="oklchL"
            :min="0"
            :max="100"
            gradient="linear-gradient(to right in oklch, black, white)"
        />
    </div>
</template>
