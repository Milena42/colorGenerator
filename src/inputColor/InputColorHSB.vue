<script setup lang="ts">
import chroma from 'chroma-js';
import { computed, reactive, watch } from 'vue';
import { round } from './InputColor.vue';
import InputRangeColor from './InputRangeColor.vue';

const color = defineModel<string>({ required: true });

const hsb = reactive({ h: 0, s: 0, b: 0 });

//TODO при редактировании одной части другие не должны меняться
watch(
    color,
    () => {
        const [h, s, b] = chroma(color.value).hsv();
        if (h) hsb.h = round(h);
        if (s) hsb.s = round(s * 100);
        if (b) hsb.b = round(b * 100);
    },
    { immediate: true },
);

watch(hsb, () => {
    const { h: h1, s, b } = hsb;
    color.value = chroma.hsv(h1, s / 100, b / 100).hex('rgb');
});

const borders = computed(() => {
    const { h, s: s1, b: b1 } = hsb;
    const s = s1 / 100;
    const b = b1 / 100;
    return {
        s: { min: chroma.hsv(h, 0, b).hex('rgb'), max: chroma.hsv(h, 1, b).hex('rgb') },
        b: { min: chroma.hsv(h, s, 0).hex('rgb'), max: chroma.hsv(h, s, 1).hex('rgb') },
    };
});
</script>
<template>
    <div class="col">
        <InputRangeColor
            v-model="hsb.h"
            label="H"
            id="hsbH"
            gradient="linear-gradient(to right in hsl longer hue, hsl(0 100 50), hsl(360 100 50)"
            :min="0"
            :max="360"
        />
        <InputRangeColor
            v-model="hsb.s"
            label="S"
            id="hsbS"
            :min="0"
            :max="100"
            :gradient-borders="borders.s"
        />
        <InputRangeColor
            v-model="hsb.b"
            label="B"
            id="hsbB"
            :min="0"
            :max="100"
            :gradient-borders="borders.b"
        />
    </div>
</template>
