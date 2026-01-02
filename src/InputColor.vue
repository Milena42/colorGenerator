<script setup lang="ts">
import { computed, type ModelRef } from 'vue';
import type { Color } from './model/myTypes';

const color: ModelRef<Color> = defineModel({ required: true });

const colorValue = computed(() => color.value.adjustForRGB());
</script>
<template>
    <div class="input-color" :style="{ backgroundColor: colorValue }"></div>
    <div>
        <input type="range" min="0" max="100" v-model.number.lazy="color.l" />
        <input type="number" v-model.number.lazy="color.l" />
    </div>
    <div>
        <input type="range" min="0" max="35" v-model.number.lazy="color.c" />
        <input type="number" v-model.number.lazy="color.c" />
    </div>
    <div>
        <input type="range" min="0" max="359" v-model.number.lazy="color.h" />
        <input type="number" v-model.number.lazy="color.h" />
    </div>
</template>
<style scoped>
.input-color {
    height: 2rem;
    width: 3rem;
}
input[type='number'] {
    width: 3rem;
}
</style>
