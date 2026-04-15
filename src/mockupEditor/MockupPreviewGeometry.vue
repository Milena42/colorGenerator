<script setup lang="ts">
import { getCssColors, type MockupColors } from '@/generator/common';
import { computed } from 'vue';

const props = defineProps<{
    colors: MockupColors;
}>();

const cssColors = computed(() => getCssColors(props.colors, 'rgbHex'));
</script>

<template>
    <div class="mockup" :style="cssColors">
        <div>
            <div class="shape color1"></div>
            <div class="shape color2"></div>
            <div class="shape color3"></div>
            <div class="shape color4"></div>
            <div class="shape color5"></div>
        </div>
        <div>
            <div class="shape color2"></div>
            <div class="shape color3"></div>
            <div class="shape color4"></div>
            <div class="shape color5"></div>
            <div class="shape color1"></div>
        </div>
        <div>
            <div class="shape color3"></div>
            <div class="shape color4"></div>
            <div class="shape color5"></div>
            <div class="shape color1"></div>
            <div class="shape color2"></div>
        </div>
        <div>
            <div class="shape color4"></div>
            <div class="shape color5"></div>
            <div class="shape color1"></div>
            <div class="shape color2"></div>
            <div class="shape color3"></div>
        </div>
        <div>
            <div class="shape color5"></div>
            <div class="shape color1"></div>
            <div class="shape color2"></div>
            <div class="shape color3"></div>
            <div class="shape color4"></div>
        </div>
    </div>
</template>

<style scoped>
.mockup {
    width: 24rem;
    height: 35rem;

    display: flex;
    flex-flow: row nowrap;
    align-items: stretch;

    gap: 1rem;
    padding: 2rem;
    border-radius: var(--radius);

    > div {
        flex: 1 1 0;
        display: flex;
        flex-flow: column nowrap;
        align-items: stretch;
    }
}

.shape {
    height: 1rem;
    flex: 1 1 0;
}

.color1 {
    background-color: var(--overlay);
}
.color2 {
    background-color: var(--accentLarge);
}
.color3 {
    background-color: var(--accentSmall);
}
.color4 {
    background-color: var(--accentBright);
}
.color5 {
    background-color: var(--text);
}
</style>
