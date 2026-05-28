<script setup lang="ts">
import { type MockupColors } from '@/generator/common';
import type { ColorRole, ThemeName } from '@/generator/themesExample';
import { SHOW_PLOTS } from '@/injectionKeys';
import { defineAsyncComponent, inject, ref, shallowRef, watch } from 'vue';
import CssOutput from './CssOutput.vue';
import MockupPreview from './MockupPreview.vue';
import MockupPreviewLanding from './MockupPreviewLanding.vue';
import PaletteOutput from './PaletteOutput.vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    colors: Record<ThemeName, MockupColors<ColorRole>>;
}>();

const colorsLightLocal = shallowRef(props.colors.light);
const colorsDarkLocal = shallowRef(props.colors.dark);

watch([() => props.colors.light, () => props.colors.dark], () => {
    colorsLightLocal.value = props.colors.light;
    colorsDarkLocal.value = props.colors.dark;
});

const showPlots = inject(SHOW_PLOTS) ?? ref(false);

const previewType = ref<'elementsUI' | 'landingsMixed' | 'landings' | 'css'>('elementsUI');
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor-settings">
            <button
                class="choice-chip"
                :class="{ current: previewType == 'css' }"
                @click="previewType = 'css'"
            >
                CSS
            </button>

            <div class="choice-chips">
                <button
                    class="choice-chip"
                    :class="{ current: previewType == 'elementsUI' }"
                    @click="previewType = 'elementsUI'"
                >
                    Элементы интерфейса
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: previewType == 'landingsMixed' }"
                    @click="previewType = 'landingsMixed'"
                >
                    Макет 1
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: previewType == 'landings' }"
                    @click="previewType = 'landings'"
                >
                    Макет 2
                </button>
            </div>
        </div>
        <div class="mockup-editor">
            <div class="row">
                <PaletteOutput v-model="colorsDarkLocal" />
                <MockupPreview v-if="previewType == 'elementsUI'" :colors="colorsDarkLocal" />

                <MockupPreviewLanding
                    v-if="previewType == 'landingsMixed'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="mixed-dark"
                />
                <MockupPreviewLanding
                    v-if="previewType == 'landings'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="dark"
                />
            </div>
            <CssOutput
                v-if="previewType == 'css'"
                :colors="{ dark: colorsDarkLocal, light: colorsLightLocal }"
            />
            <div class="row">
                <MockupPreviewLanding
                    v-if="previewType == 'landingsMixed'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="mixed-light"
                />
                <MockupPreviewLanding
                    v-if="previewType == 'landings'"
                    :colorsDark="colorsDarkLocal"
                    :colorsLight="colorsLightLocal"
                    theme="light"
                />

                <MockupPreview v-if="previewType == 'elementsUI'" :colors="colorsLightLocal" />
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
    gap: 1rem;
    align-items: center;
}

.mockup-editor-settings {
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
    align-items: stretch;
    justify-content: center;
}
.mockup-landings {
    gap: 1rem;
}
</style>
