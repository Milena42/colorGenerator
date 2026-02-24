<script setup lang="ts">
import { ref, watch } from 'vue';

const model = defineModel<number>({ required: true });

const props = defineProps<{
    min: number;
    max: number;
    step: number;
    circle?: boolean;
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
    const n = parseFloat(valueInternal.value);
    if (!Number.isNaN(n)) {
        model.value = Math.max(props.min, Math.min(n, props.max));
    } else {
        model.value = props.min;
        valueInternal.value = props.min.toFixed(2);
    }
    valueInternal.value = model.value.toFixed(2);
}

function decrement() {
    let n = model.value - props.step;
    if (n < props.min) {
        if (props.circle) {
            n = props.max;
        } else {
            n = props.min;
        }
    }
    model.value = n;
}

function increment() {
    let n = model.value + props.step;
    if (n > props.max) {
        if (props.circle) {
            n = props.min;
        } else {
            n = props.max;
        }
    }
    model.value = n;
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
