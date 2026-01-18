<script lang="ts">
export function round(n: number) {
    return parseFloat(n.toFixed(2));
}
</script>

<script setup lang="ts">
import type { Color, ColorFormat } from '@/model/myTypes';
import chroma from 'chroma-js';
import { computed, inject, ref, type Ref } from 'vue';
import InputColorHSB from './InputColorHSB.vue';
import InputColorOKLCH from './InputColorOKLCH.vue';

const color = defineModel<Color>({ required: true });

const colorFormatEdit = inject<Ref<ColorFormat>>('colorFormatEdit');

const colorFormatCopy = inject<Ref<ColorFormat>>('colorFormatCopy');

const alwaysShowColorStrings = inject<Ref<boolean>>('alwaysShowColorStrings');

const colorHex = computed({
    get: () => color.value.adjustForRGB(),
    set: (v) => {
        const [l, c, h] = chroma(v).oklch();
        if (l) color.value.l = round(l * 100);
        if (c) color.value.c = round(c * 100);
        if (h) color.value.h = round(h);
    },
});

const colorString = computed(() => {
    switch (colorFormatCopy?.value) {
        case 'oklch':
            const { l, c, h } = color.value;
            return `oklch(${l}% ${(c / 100).toFixed(2)} ${h.toFixed(2)})`;
        case 'rgbHex':
        default:
            return colorHex.value;
    }
});

const editing = ref(false);

async function copy() {
    await navigator.clipboard.writeText(colorString.value);
}
</script>

<template>
    <div class="input-color">
        <div class="row">
            <div class="color-preview" :style="{ backgroundColor: colorString }">
                <button @click="editing = !editing" title="редактировать цвет">
                    <span class="material-symbols-rounded">tune</span>
                </button>
                <button @click="copy" title="копировать цвет">
                    <span class="material-symbols-rounded">content_copy</span>
                </button>
            </div>
            <p v-if="alwaysShowColorStrings">{{ colorString }}</p>
        </div>
        <div class="col" v-if="editing">
            <InputColorHSB v-model="colorHex" v-if="colorFormatEdit == 'rgbHex'" />
            <InputColorOKLCH v-model="color" v-if="colorFormatEdit == 'oklch'" />
        </div>
    </div>
</template>

<style scoped>
.input-color {
    display: flex;
    flex-flow: column nowrap;
    gap: 0.5rem;
    align-items: center;

    & > .row {
        align-items: center;
        gap: 0.5rem;
    }

    .color-preview {
        border-radius: 0.3rem;
        border: 1px solid var(--transparent-pale);
        display: flex;
        overflow: hidden;

        button {
            background: var(--transparent-overlay);
            border-radius: 0px;
        }

        button {
            visibility: hidden;
        }
        &:hover button {
            visibility: visible;
        }
    }

    p {
        font-family: monospace;
        font-size: 0.9rem;
    }

    .edit {
        min-width: 20rem;
    }
}
</style>
