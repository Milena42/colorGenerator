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
        if (l || l == 0) color.value.l = round(l * 100);
        if (c || c == 0) color.value.c = round(c * 100);
        if (h || h == 0) color.value.h = round(h);
    },
});

const colorString = computed({
    get: () => {
        switch (colorFormatCopy?.value) {
            case 'oklch':
                const { l, c, h } = color.value;
                return `oklch(${l}% ${(c / 100).toFixed(2)} ${h.toFixed(2)})`;
            case 'rgbHex':
            default:
                return colorHex.value;
        }
    },
    set: (v) => {
        try {
            colorHex.value = chroma(v).hex('rgb');
        } catch {
            colorHex.value = '#000';
        }
    },
});

const editing = ref(false);

async function copy() {
    try {
        await navigator.clipboard.writeText(colorString.value);
    } catch (e) {
        if (e instanceof DOMException && e.name == 'NotAllowedError') {
            console.error('доступ к буферу обмена запрещен'); //TODO сообщение?
        }
        console.error(e);
        return;
    }
    //alert('цвет скопирован');//TODO сообщение?
}
</script>

<template>
    <div class="input-color">
        <div class="row">
            <div class="color-preview" :style="{ backgroundColor: colorString }">
                <button @click="editing = !editing" title="редактировать цвет">
                    <span class="material-symbols-rounded">tune</span>
                </button>
                <button @click="copy" :title="`копировать цвет: ${colorString}`">
                    <span class="material-symbols-rounded">content_copy</span>
                </button>
            </div>
            <p v-if="alwaysShowColorStrings && !editing">{{ colorString }}</p>
            <input v-if="editing" v-model.lazy="colorString" />
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
