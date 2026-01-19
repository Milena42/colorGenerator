<script setup lang="ts">
import { ref, watch } from 'vue';

const model = defineModel<number>({ required: true });

const props = defineProps<{
    min: number;
    max: number;
    step: number;
}>();

const valueInternal = ref('');

watch(
    model,
    (newV) => {
        valueInternal.value = newV.toFixed(2);
    },
    { immediate: true },
);

function change() {
    const n = parseFloat(valueInternal.value); //TODO мб регулярка на цифры?
    if (!Number.isNaN(n)) {
        model.value = n;
    } else {
        model.value = 0;
        valueInternal.value = '0.00';
    }
}

function decrement() {
    const n = model.value - props.step;
    model.value = Math.max(n, props.min);
}

function increment() {
    const n = model.value + props.step;
    model.value = Math.min(n, props.max);
}
</script>

<template>
    <div class="input-number">
        <button @click="decrement">-</button>
        <input type="text" v-model="valueInternal" @change="change" />
        <button @click="increment">+</button>
    </div>
</template>

<style scoped>
.input-number {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;

    input {
        width: 5rem;
        text-align: center;
        padding: 0.1rem 0.2rem;
    }

    button {
        background: inherit;
        border: none;
    }
}
</style>
