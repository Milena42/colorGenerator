<script setup lang="ts">
import chroma from 'chroma-js';
import { computed, provide, ref } from 'vue';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

const showPlots = ref(false);
provide('showPlots', showPlots);

const bgColor = ref('#ffffff');
const themeIsLight = computed(() => {
    const c = chroma(bgColor.value);
    const l = c.get('oklch.l');
    return l > 0.5;
});
</script>
<template>
    <div class="col page" :class="themeIsLight ? 'light' : 'dark'" :style="{ background: bgColor }">
        <div class="row">
            <div class="choice-chips">
                <RouterLink class="choice-chip" activeClass="current" to="/picture"
                    >С картинки</RouterLink
                >
                <RouterLink class="choice-chip" activeClass="current" to="/wheel"
                    >По кругу</RouterLink
                >
            </div>
            <div>
                <input type="checkbox" v-model="showPlots" id="showPlots" />
                <label for="showPlots">показывать графики</label>
            </div>
            <div>
                <input type="checkbox" v-model="showQuantityOnPlots" id="showQ" />
                <label for="showQ">показывать количество на графиках</label>
            </div>
            <div>
                <input type="color" v-model="bgColor" />
            </div>
        </div>
        <RouterView class="grow w-full" />
    </div>
</template>
<style scoped>
.page {
    padding: 1rem;
    gap: 1rem;
    min-height: 100%;
    width: 100%;
    color: var(--text-color);
}

.page.light {
    --text-color: black;
}

.page.dark {
    --text-color: white;
}
</style>
