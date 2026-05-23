<script setup lang="ts">
import chroma from 'chroma-js';
import { ref, watch } from 'vue';

const h = defineModel<number>();

const localInput = ref(false);
watch(h, () => {
    if (localInput.value) {
        localInput.value = false;
        return;
    }
    colorString.value = '';
});

const emit = defineEmits<{
    change: [];
}>();

const colorString = ref('');

function change() {
    let h1: number;
    try {
        h1 = chroma(colorString.value).get('oklch.h');
    } catch {
        h1 = 0;
    }

    if (!h1) h1 = 0;
    h.value = h1;

    localInput.value = true;
    emit('change');
}
</script>

<template>
    <input v-model="colorString" @change="change" type="text" />
</template>

<style scoped>
input {
    font-family: var(--font-mono);
    width: 6rem;
}
</style>
