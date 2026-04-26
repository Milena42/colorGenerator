<script setup lang="ts">
import IconCopy from '@/assets/icons/IconCopy.vue';
import { getCssColors, type ColorFormat, type MockupColors } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { computed, inject, ref, type Ref } from 'vue';

const props = defineProps<{
    colorsLight: MockupColors<ColorRole>;
    colorsDark: MockupColors<ColorRole>;
}>();

const colorFormatCopy = inject<Ref<ColorFormat>>('colorFormatCopy', ref('rgbHex'));

const css = computed(
    () => `.dark {
${getCssColors(props.colorsDark, colorFormatCopy.value)}
}
.light {
${getCssColors(props.colorsLight, colorFormatCopy.value)}
}`,
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
