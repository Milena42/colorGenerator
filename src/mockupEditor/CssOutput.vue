<script setup lang="ts">
import IconCopy from '@/assets/icons/IconCopy.vue';
import { type ColorFormat, getCssColors, type MockupColors } from '@/generator/common';
import { COLOR_FORMAT_COPY } from '@/injectionKeys';
import { computed, inject, ref } from 'vue';

const props = defineProps<{
    colors: Record<string, MockupColors<string>>;
}>();

const colorFormatCopy = inject(COLOR_FORMAT_COPY, ref<ColorFormat>('rgbHex'));

const css = computed(() =>
    Object.entries(props.colors)
        .map(([t, colors]) => `.${t} {\n${getCssColors(colors, colorFormatCopy.value)}\n}`)
        .join('\n'),
);

async function copyAll() {
    const stylesToCopy = css.value;

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
</script>
<template>
    <div class="css-output">
        <button @click="copyAll" title="копировать палитру в CSS">
            <IconCopy />
        </button>
        <div class="code">
            <code>
                {{ css }}
            </code>
        </div>
    </div>
</template>
<style scoped>
.css-output {
    border: 2px solid var(--pale);
    border-radius: var(--radius-around);

    button {
        margin-left: auto;
    }
}
.code {
    padding: 0px 3rem 1rem 2rem;
}
code {
    white-space: pre;
}
</style>
