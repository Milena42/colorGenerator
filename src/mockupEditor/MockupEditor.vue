<script setup lang="ts">
import { type ColorFormat, type MockupColors } from '@/model/myTypes';
import { provide, ref } from 'vue';
import MockupPreview from './MockupPreview.vue';
import PaletteOutput from './PaletteOutput.vue';

const props = defineProps<{
    colorsLight: MockupColors;
    colorsDark: MockupColors;
}>();

const colorsLightLocal = ref(props.colorsLight);
const colorsDarkLocal = ref(props.colorsDark);

const colorFormatCopy = ref<ColorFormat>('rgbHex');
provide('colorFormatCopy', colorFormatCopy);

const colorFormatEdit = ref<ColorFormat>('oklch');
provide('colorFormatEdit', colorFormatEdit);
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor-copy">
            <div class="choice-chips">
                <button
                    class="choice-chip"
                    :class="{ current: colorFormatCopy == 'rgbHex' }"
                    @click="colorFormatCopy = 'rgbHex'"
                >
                    RGB (hex)
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: colorFormatCopy == 'oklch' }"
                    @click="colorFormatCopy = 'oklch'"
                >
                    OKLCH
                </button>
            </div>
            <button><span class="material-symbols-rounded">content_copy</span></button>
        </div>
        <div class="mockup-editor">
            <div class="row">
                <PaletteOutput v-model="colorsDarkLocal" />
                <MockupPreview :colors="colorsDarkLocal" />
            </div>
            <div class="row">
                <MockupPreview :colors="colorsLightLocal" />
                <PaletteOutput v-model="colorsLightLocal" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.mockup-editor-wrapper {
    display: flex;
    flex-flow: column nowrap;
    gap: 0px;
    align-items: stretch;
}

.mockup-editor-copy {
    display: flex;
    justify-content: center;
    align-items: center;

    padding: 2rem;
    gap: 1rem;
}

.mockup-editor {
    display: flex;
    flex-flow: row wrap;
    gap: 0px;
    align-items: center;
    justify-content: center;
}
</style>
