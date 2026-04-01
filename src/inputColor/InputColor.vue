<script lang="ts">
export function round(n: number) {
    return parseFloat(n.toFixed(2));
}

export function getColorString(color: Color, format: ColorFormat) {
    switch (format) {
        case 'oklch':
            const { l, c, h } = color;
            return `oklch(${l}% ${(c / 100).toFixed(2)} ${h.toFixed(2)})`;
        case 'rgbHex':
        default:
            return color.adjustForRGB();
    }
}
</script>

<script setup lang="ts">
import IconCopy from '@/assets/icons/IconCopy.vue';
import IconTune from '@/assets/icons/IconTune.vue';
import type { Color, ColorFormat } from '@/model/myTypes';
import { vOnClickOutside } from '@vueuse/components';
import chroma from 'chroma-js';
import { computed, inject, ref, type Ref } from 'vue';
import InputColorHSB from './InputColorHSB.vue';
import InputColorOKLCH from './InputColorOKLCH.vue';

defineProps<{
    role: string;
}>();

const color = defineModel<Color>({ required: true });

const colorFormatEdit = inject<Ref<ColorFormat>>('colorFormatEdit');

const colorFormatCopy = inject<Ref<ColorFormat>>('colorFormatCopy');

const alwaysShowColorStrings = inject<Ref<boolean>>('alwaysShowColorStrings');

const colorHex = computed({
    get: () => color.value.adjustForRGB(),
    set: (v) => {
        const [l, c, h] = chroma(v).oklch();
        if (l || l == 0) color.value.l = l * 100;
        if (c || c == 0) color.value.c = c * 100;
        if (h || h == 0) color.value.h = h;
        console.log(v, l, c, h, color.value); //TODO погрешность при вводе hex строкой
        console.log(chroma.oklch(l, c, h).clipped());
    },
});

const colorString = computed({
    get: () => getColorString(color.value, colorFormatCopy?.value ?? 'rgbHex'),
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
    <div class="input-color" v-on-click-outside="() => (editing = false)">
        <div class="row">
            <div class="swatch">
                <p class="role">{{ role }}</p>
                <div class="color-preview" :style="{ backgroundColor: colorString }">
                    <button @click="editing = !editing" title="редактировать цвет">
                        <IconTune />
                    </button>
                    <button @click="copy" :title="`копировать цвет: ${colorString}`">
                        <IconCopy />
                    </button>
                </div>
            </div>
            <p v-if="alwaysShowColorStrings && !editing">{{ colorString }}</p>
            <input v-if="editing" v-model.lazy="colorString" type="text" class="grow" />
        </div>
        <div class="col" v-if="editing">
            <InputColorHSB v-model="colorHex" v-if="colorFormatEdit == 'hsb'" />
            <InputColorOKLCH v-model="color" v-if="colorFormatEdit == 'oklch'" />
        </div>
    </div>
</template>

<style scoped>
.input-color {
    font-family: 'Source Code Pro', monospace;

    p {
        font-size: 0.9rem;
        margin: 0px;
    }
    p.role {
        font-size: 0.7rem;
    }

    display: flex;
    flex-flow: column nowrap;
    gap: 0.5rem;
    align-items: stretch;

    & > .row {
        align-items: center;
        gap: 0.5rem;
    }

    .swatch {
        position: relative;
        & > .role {
            text-align: center;
            position: absolute;
            top: -1rem;
            left: 50%;
            transform: translateX(-50%);
        }
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
}
</style>
