<script setup lang="ts" generic="T extends string">
import { ContentClient } from '@/extension/contentClient';
import { getCssColors, type MockupColors } from '@/generator/common';
import CssOutput from '@/mockupEditor/CssOutput.vue';
import PaletteOutput from '@/mockupEditor/PaletteOutput.vue';
import {
    computed,
    defineAsyncComponent,
    inject,
    ref,
    shallowRef,
    watch,
    type Ref,
    type ShallowRef,
} from 'vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    colorsLight: MockupColors<T>;
    colorsDark: MockupColors<T>;
}>();

const colorsLocal: ShallowRef<MockupColors<T>> = shallowRef<MockupColors<T>>(props.colorsLight);

watch(
    () => props.colorsLight,
    () => {
        colorsLocal.value = props.colorsLight;
    },
);

const showPlots: Ref<boolean> = inject('showPlots') ?? ref(false);

const css = computed(() => getCssColors(colorsLocal.value, 'rgbHex'));

const contentScriptClient = inject<ContentClient>('contentScriptClient');

watch(css, () => {
    contentScriptClient?.call('setCss', { css: css.value });
});
</script>

<template>
    <div class="mockup-editor-wrapper">
        <div class="mockup-editor">
            <CssOutput :colorsDark="colorsLocal" :colorsLight="colorsLocal" />
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
