<script setup lang="ts" generic="R extends string">
import { getCssColors, type MockupColors } from '@/generator/common';
import { CONTENT_SCRIPT_CLIENT, SHOW_PLOTS } from '@/injectionKeys';
import CssOutput from '@/mockupEditor/CssOutput.vue';
import PaletteOutput from '@/mockupEditor/PaletteOutput.vue';
import { computed, defineAsyncComponent, inject, ref, shallowRef, watch } from 'vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    colors: Record<string, MockupColors<R>>;
}>();

const selector = computed(() => Object.keys(props.colors)[0]); //TODO пока 1, потом переделать
const colorsLocal = shallowRef<Record<string, MockupColors<R>>>(props.colors);

watch(
    () => props.colors,
    () => {
        colorsLocal.value = props.colors;
    },
);

const showPlots = inject(SHOW_PLOTS) ?? ref(false);

const css = computed(() => getCssColors(colorsLocal.value[selector.value], 'rgbHex'));

const contentScriptClient = inject(CONTENT_SCRIPT_CLIENT);

watch(
    css,
    () => {
        contentScriptClient?.call('setCss', { css: css.value });
    },
    { immediate: true },
);
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor">
            <CssOutput :colors="colorsLocal" customSelectors />
            <PaletteOutput v-model="colorsLocal[selector]" />
        </div>

        <div v-if="showPlots" class="row">
            <figure>
                <ColorModels3d
                    :k="0.003"
                    :data="colorsLocal[selector]"
                    :totalQ="7"
                    wireframe
                    :size="500"
                />
                <figcaption>Полученные цвета</figcaption>
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

.mockup-editor {
    display: flex;
    flex-flow: row wrap;
    gap: 0px;
    align-items: stretch;
    justify-content: center;
}
</style>
