<script setup lang="ts">
import chroma from 'chroma-js';
import { ref } from 'vue';

const h = defineModel();

const emit = defineEmits<{
    change: [];
}>();

const colorString = ref('');

function change() {
    let h1;
    try {
        h1 = chroma(colorString.value).get('oklch.h');
    } catch {
        h1 = 0;
    }

    if (!h1) h1 = 0;
    h.value = h1;

    emit('change');
}
</script>

<template>
    <input v-model="colorString" @change="change" />
</template>

<style scoped>
input {
    font-family: 'Source Code Pro', monospace;
    width: 6rem;
}
</style>
