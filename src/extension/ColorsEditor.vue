<script setup lang="ts" generic="R extends string">
import { getCssColors, type MockupColors } from '@/generator/common';
import { CONTENT_SCRIPT_CLIENT, SHOW_PLOTS } from '@/injectionKeys';
import CssOutput from '@/mockupEditor/CssOutput.vue';
import PaletteOutput from '@/mockupEditor/PaletteOutput.vue';
import {
    computed,
    defineAsyncComponent,
    inject,
    ref,
    shallowRef,
    watch,
    type ShallowRef,
} from 'vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    colors: Record<'theme', MockupColors<R>>;
}>();

const colorsLocal: ShallowRef<MockupColors<R>> = shallowRef<MockupColors<R>>(props.colors.theme);

watch(
    () => props.colors.theme,
    () => {
        colorsLocal.value = props.colors.theme;
    },
);

const showPlots = inject(SHOW_PLOTS) ?? ref(false);

const css = computed(() => getCssColors(colorsLocal.value, 'rgbHex'));

const contentScriptClient = inject(CONTENT_SCRIPT_CLIENT);

watch(css, () => {
    contentScriptClient?.call('setCss', { css: css.value });
});
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor">
            <CssOutput :colors="{ theme: colorsLocal }" />
            <PaletteOutput v-model="colorsLocal" />
        </div>

        <div v-if="showPlots" class="row">
            <figure>
                <ColorModels3d :k="0.003" :data="colorsLocal" :totalQ="7" wireframe :size="500" />
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
