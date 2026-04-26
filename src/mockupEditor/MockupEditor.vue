<script setup lang="ts">
import { type MockupColors } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { defineAsyncComponent, inject, ref, shallowRef, watch, type Ref } from 'vue';
import CssOutput from './CssOutput.vue';
import MockupPreview from './MockupPreview.vue';
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
                    Лендинги
                </button>
                <button
                    class="choice-chip"
                    :class="{ current: previewType == 'landings' }"
                    @click="previewType = 'landings'"
                >
                    Лендинги 2
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
                :colorsDark="colorsDarkLocal"
                :colorsLight="colorsLightLocal"
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
    gap: 2rem;
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
