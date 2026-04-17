<script setup lang="ts">
import IconCopy from '@/assets/icons/IconCopy.vue';
import { getCssColors, type ColorFormat, type MockupColors } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { defineAsyncComponent, inject, provide, ref, shallowRef, watch, type Ref } from 'vue';
import MockupPreview from './MockupPreview.vue';
import MockupPreviewGeometry from './MockupPreviewGeometry.vue';
import MockupPreviewLanding from './MockupPreviewLanding.vue';
import PaletteOutput from './PaletteOutput.vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    colorsLight: MockupColors<ColorRole>;
    colorsDark: MockupColors<ColorRole>;
}>();

const colorsLightLocal = shallowRef(props.colorsLight);
const colorsDarkLocal = shallowRef(props.colorsDark);

watch([() => props.colorsLight, () => props.colorsDark], () => {
    colorsLightLocal.value = props.colorsLight;
    colorsDarkLocal.value = props.colorsDark;
});

const showPlots: Ref<boolean> = inject('showPlots') ?? ref(false);

const colorFormatCopy = ref<ColorFormat>('rgbHex');
provide('colorFormatCopy', colorFormatCopy);

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

const mockupType = ref<'elementsUI' | 'landingsMixed' | 'landings' | 'geometry'>('elementsUI');
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor-copy">
            <div class="choice-chips">
                <button
                    class="choice-chip"
                    :class="{ current: mockupType == 'elementsUI' }"
                    @click="mockupType = 'elementsUI'"
                >
                    Элементы интерфейса
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: mockupType == 'landingsMixed' }"
                    @click="mockupType = 'landingsMixed'"
                >
                    Лендинги
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: mockupType == 'landings' }"
                    @click="mockupType = 'landings'"
                >
                    Лендинги 2
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: mockupType == 'geometry' }"
                    @click="mockupType = 'geometry'"
                >
                    Геометрия
                </button>
            </div>
            <div class="choice-chips">
                <button
                    class="choice-chip"
                    :class="{ current: colorFormatCopy == 'rgbHex' }"
                    @click="colorFormatCopy = 'rgbHex'"
                    :title="colorFormatCopy == 'rgbHex' ? '' : 'выбрать RGB для кодов цветов'"
                >
                    RGB (hex)
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: colorFormatCopy == 'oklch' }"
                    @click="colorFormatCopy = 'oklch'"
                    :title="colorFormatCopy == 'oklch' ? '' : 'выбрать OKLCH для кодов цветов'"
                >
                    OKLCH
                </button>
            </div>
            <button @click="copyAll" title="копировать палитру в CSS">
                <IconCopy />
            </button>
        </div>
        <div class="mockup-editor">
            <div class="row">
                <PaletteOutput v-model="colorsDarkLocal" />
                <MockupPreview v-if="mockupType == 'elementsUI'" :colors="colorsDarkLocal" />

                <MockupPreviewLanding
                    v-if="mockupType == 'landingsMixed'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="mixed-dark"
                />
                <MockupPreviewLanding
                    v-if="mockupType == 'landings'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="dark"
                />
                <MockupPreviewGeometry v-if="mockupType == 'geometry'" :colors="colorsDarkLocal" />
            </div>

            <div class="row">
                <MockupPreviewGeometry v-if="mockupType == 'geometry'" :colors="colorsLightLocal" />
                <MockupPreviewLanding
                    v-if="mockupType == 'landingsMixed'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="mixed-light"
                />
                <MockupPreviewLanding
                    v-if="mockupType == 'landings'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="light"
                />

                <MockupPreview v-if="mockupType == 'elementsUI'" :colors="colorsLightLocal" />
                <PaletteOutput v-model="colorsLightLocal" />
            </div>
        </div>

        <div v-if="showPlots" class="row">
            <figure>
                <ColorModels3d
                    :k="0.003"
                    :data="colorsDarkLocal"
                    :totalQ="7"
                    wireframe
                    :size="500"
                />
                <figcaption>Темная тема</figcaption>
            </figure>
            <figure>
                <ColorModels3d
                    :k="0.003"
                    :data="colorsLightLocal"
                    :totalQ="7"
                    wireframe
                    :size="500"
                />
                <figcaption>Светлая тема</figcaption>
            </figure>
        </div>
    </div>
</template>

<style scoped>
.mockup-editor-wrapper {
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
