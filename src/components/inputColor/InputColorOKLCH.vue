<script setup lang="ts">
import { Color } from '@/generator/common';
import { computed } from 'vue';
import InputRangeColor from './InputRangeColor.vue';

const color = defineModel<Color>({ required: true });

const bordersC = computed(() => {
    const { l, h } = color.value;
    const c1 = new Color(l, { c: 40, h });
    const maxCHex = c1.adjustForRGB();
    const maxC = c1.c;
    return {
        maxC,
        gradient: `linear-gradient(to right in oklab, oklch(${l}% 0 ${h}), ${maxCHex})`,
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
            :max="bordersC.maxC"
            :width="bordersC.maxC / 40"
            :gradient="bordersC.gradient"
        />
        <InputRangeColor
            v-model="color.l"
            label="L"
            id="oklchL"
            :min="0"
            :max="100"
            gradient="linear-gradient(to right in oklab, black, white)"
        />
    </div>
</template>
