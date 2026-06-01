<script setup lang="ts">
import IconCheck from '@/assets/icons/IconCheck.vue';
import IconCopy from '@/assets/icons/IconCopy.vue';
import { type ColorFormat, getCssColors, type MockupColors } from '@/generator/common';
import { COLOR_FORMAT_COPY } from '@/injectionKeys';
import { computed, inject, ref } from 'vue';

const props = defineProps<{
    colors: Record<string, MockupColors<string>>;
    customSelectors?: boolean;
}>();

const colorFormatCopy = inject(COLOR_FORMAT_COPY, ref<ColorFormat>('rgbHex'));

const css = computed(() => {
    const p = props.customSelectors ? '' : '.';
    return Object.entries(props.colors)
        .map(([t, colors]) => `${p}${t} {\n${getCssColors(colors, colorFormatCopy.value)}\n}`)
        .join('\n');
});

const copiedIndicator = ref(false);

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

    copiedIndicator.value = true;
    setTimeout(() => {
        copiedIndicator.value = false;
    }, 1000);
}
</script>
<template>
    <div class="css-output">
        <button @click="copyAll" title="копировать палитру в CSS">
            <IconCopy v-if="!copiedIndicator" />
            <IconCheck v-if="copiedIndicator" />
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
