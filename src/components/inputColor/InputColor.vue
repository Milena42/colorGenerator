<script setup lang="ts">
import IconCopy from '@/assets/icons/IconCopy.vue';
import IconTune from '@/assets/icons/IconTune.vue';
import TransitionExpand from '@/assets/TransitionExpand.vue';
import { getColorString, type Color, type ColorFormat } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { vOnClickOutside } from '@vueuse/components';
import chroma from 'chroma-js';
import { computed, inject, type Ref } from 'vue';
import InputColorHSB from './InputColorHSB.vue';
import InputColorOKLCH from './InputColorOKLCH.vue';

defineProps<{
    role: ColorRole;
    editing: boolean;
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

const emit = defineEmits<{
    openEditing: [ColorRole];
    closeEditing: [];
}>();
</script>

<template>
    <div
        class="input-color"
        v-on-click-outside="[
            () => {
                if (editing) emit('closeEditing');
            },
            { ignore: ['.open-color-editor', '.settings'] },
        ]"
    >
        <div class="row">
            <div class="swatch">
                <p class="role">{{ role }}</p>
                <div class="color-preview" :style="{ backgroundColor: colorString }">
                    <button
                        class="open-color-editor"
                        @click="editing ? emit('closeEditing') : emit('openEditing', role)"
                        :title="editing ? 'закрыть' : 'редактировать цвет'"
                    >
                        <IconTune />
                    </button>
                    <button @click="copy" :title="`копировать цвет: ${colorString}`">
                        <IconCopy />
                    </button>
                </div>
            </div>
            <Transition name="fade" mode="out-in">
                <p v-if="alwaysShowColorStrings && !editing" class="input-color-gap-x">
                    {{ colorString }}
                </p>
                <input
                    v-else-if="editing"
                    v-model.lazy="colorString"
                    type="text"
                    class="input-color-input-text input-color-gap-x"
                />
            </Transition>
        </div>
        <TransitionExpand>
            <div class="col input-color-editing-inputs" v-if="editing">
                <InputColorHSB v-model="colorHex" v-if="colorFormatEdit == 'hsb'" />
                <InputColorOKLCH v-model="color" v-if="colorFormatEdit == 'oklch'" />
            </div>
        </TransitionExpand>
    </div>
</template>

<style scoped>
.input-color {
    font-family: var(--font-mono);
    width: min-content;
    background: var(--background);

    p {
        font-size: 0.9rem;
        margin: 0px;
    }
    p.role {
        font-size: 0.7rem;
    }

    .input-color-editing-inputs {
        padding-top: 0.5rem;
        width: calc(50px + 16em + 2.2rem);
    }

    .input-color-gap-x {
        margin-left: 0.5rem;
    }

    .input-color-input-text {
        width: 16em;
    }

    & > .row {
        align-items: center;
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
        background-origin: border-box;
        border-radius: 0.3rem;
        border: 1px solid var(--transparent-border);
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

<style>
.fade-enter-to,
.fade-leave-from {
    max-width: 20em;
    opacity: 1;
}
.fade-enter-from,
.fade-leave-to {
    max-width: 0px;
    overflow: hidden;
    opacity: 0;
}
.fade-enter-active {
    transition: all 0.4s ease-in-out;
    transition-delay: 0.1s;
    overflow: hidden;
}

.fade-leave-active {
    transition: all 0.2s linear;
    overflow: hidden;
}

.palette-swap-transition {
    .fade-enter-from,
    .fade-leave-to {
        max-width: 20em;
        opacity: 0;
    }

    .fade-enter-active {
        transition: opacity 0.4s ease-out;
        transition-delay: 0s;
    }

    .fade-leave-active {
        transition: opacity 0.1s ease-out;
    }
}
</style>
