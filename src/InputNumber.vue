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
    font-family: 'Source Code Pro', monospace;

    display: flex;
    flex-flow: row nowrap;
    align-items: center;

    input {
        width: 5rem;
        text-align: center;
    }

    button {
        line-height: 0.6em;
        padding: 0.3rem;
        border-radius: 50%;

        background: inherit;
        border: none;

        &:hover {
            background-color: var(--transparent-pale-2);
        }
    }
}
</style>
