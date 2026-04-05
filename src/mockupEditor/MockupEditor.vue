<script setup lang="ts">
import IconCopy from '@/assets/icons/IconCopy.vue';
import { type ColorFormat, type MockupColors } from '@/model/myTypes';
import { defineAsyncComponent, inject, provide, ref, watchEffect, type Ref } from 'vue';
import MockupPreview, { getCssColors } from './MockupPreview.vue';
import MockupPreviewLanding from './MockupPreviewLanding.vue';
import PaletteOutput from './PaletteOutput.vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    colorsLight: MockupColors;
    colorsDark: MockupColors;
}>();

const colorsLightLocal = ref<MockupColors>({});
const colorsDarkLocal = ref<MockupColors>({});

watchEffect(() => {
    colorsLightLocal.value = props.colorsLight;
    colorsDarkLocal.value = props.colorsDark;
});

const showPlots: Ref<boolean> = inject('showPlots') ?? ref(false);

const colorFormatCopy = ref<ColorFormat>('rgbHex');
provide('colorFormatCopy', colorFormatCopy);

const colorFormatEdit = ref<ColorFormat>('oklch');
provide('colorFormatEdit', colorFormatEdit);

async function copyAll() {
    const stylesToCopy = `.dark {
${getCssColors(colorsDarkLocal.value, colorFormatCopy.value)}
}
.light {
${getCssColors(colorsLightLocal.value, colorFormatCopy.value)}
}`;

    try {
        await navigator.clipboard.writeText(stylesToCopy);
    } catch (e) {
        if (e instanceof DOMException && e.name == 'NotAllowedError') {
            console.error('доступ к буферу обмена запрещен'); //TODO сообщение?
        }
        console.error(e);
        return;
    }
    //alert('цвет скопирован');//TODO сообщение?
}

const showLandings = inject<Ref<boolean>>('showLandings');
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor-copy">
            <div class="choice-chips">
                <button
                    class="choice-chip"
                    :class="{ current: colorFormatEdit == 'hsb' }"
                    @click="colorFormatEdit = 'hsb'"
                >
                    HSB
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: colorFormatEdit == 'oklch' }"
                    @click="colorFormatEdit = 'oklch'"
                >
                    OKLCH
                </button>
            </div>
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
            <button @click="copyAll">
                <IconCopy />
            </button>
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
        <div v-if="showLandings" class="mockup-landings">
            <MockupPreviewLanding
                :colorsDark="colorsDarkLocal"
                :colorsLight="colorsLightLocal"
                theme="mixed-dark"
            />
            <MockupPreviewLanding
                :colorsDark="colorsDarkLocal"
                :colorsLight="colorsLightLocal"
                theme="mixed-light"
            />
            <MockupPreviewLanding
                :colorsDark="colorsDarkLocal"
                :colorsLight="colorsLightLocal"
                theme="dark"
            />
            <MockupPreviewLanding
                :colorsDark="colorsDarkLocal"
                :colorsLight="colorsLightLocal"
                theme="light"
            />
        </div>
        <div v-if="showPlots" class="row">
            <ColorModels3d :k="0.003" :data="colorsDarkLocal" :totalQ="7" wireframe :size="500" />
            <ColorModels3d
                :k="0.003"
                :data="colorsDarkLocal"
                :totalQ="7"
                wireframe
                :size="500"
                hsl
            />
            <ColorModels3d :k="0.003" :data="colorsLightLocal" :totalQ="7" wireframe :size="500" />
        </div>
    </div>
</template>

<style scoped>
.mockup-editor-wrapper {
    max-width: max-content;
    width: fit-content;
    flex: 1 1 0;
    display: flex;
    flex-flow: column nowrap;
    gap: 2rem;
    align-items: center;
}

.mockup-editor-copy {
    display: flex;
    justify-content: center;
    align-items: center;

    gap: 1rem;
}

.mockup-editor,
.mockup-landings {
    display: flex;
    flex-flow: row wrap;
    gap: 0px;
    align-items: center;
    justify-content: center;
}
.mockup-landings {
    gap: 1rem;
}
</style>
