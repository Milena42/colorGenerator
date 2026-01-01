<script setup lang="ts">
import chroma from 'chroma-js';
import { computed, provide, ref } from 'vue';
import GeneratorFromPicture from './GeneratorFromPicture.vue';
import GeneratorFromWheel from './GeneratorFromWheel.vue';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

const enum tabs {
    picture,
    colorWheel,
}
const currentTab = ref(tabs.picture);
const bgColor = ref('#ffffff');
const themeIsLight = computed(() => {
    const c = chroma(bgColor.value);
    const l = c.get('oklch.l');
    return l > 0.5;
});
</script>
<template>
    <div class="col page" :class="themeIsLight ? 'light' : 'dark'" :style="{ background: bgColor }">
        <div>
            <input type="checkbox" v-model="showQuantityOnPlots" id="showQ" />
            <label for="showQ">показывать количество на графиках</label>
        </div>
        <div>
            <input type="color" v-model="bgColor" />
        </div>
        <div>
            <button @click="currentTab = tabs.picture">С картинки</button>
            <button @click="currentTab = tabs.colorWheel">По кругу</button>
        </div>
        <div v-show="currentTab == tabs.picture">
            <GeneratorFromPicture />
        </div>
        <div v-show="currentTab == tabs.colorWheel">
            <GeneratorFromWheel />
        </div>
    </div>
</template>
<style>
html,
body,
#app {
    margin: 0px;
    width: 100%;
    height: 100%;
}
.page {
    padding: 1rem;
    gap: 1rem;
    min-height: 100%;
    width: 100%;
}
.page.light {
    color: black;
    .icon {
        --primary: black;
    }
}
.page.dark {
    color: white;
    .icon {
        --primary: white;
    }
}

.userUpload {
    gap: 2rem;
    align-items: stretch;

    & > * {
        flex-grow: 1;
        flex-shrink: 1;
        max-height: max(40vh, 200px);
    }
}

.mockups {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr 1fr;
}

.m1 {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr 2fr;
}

.row {
    display: flex;
    flex-flow: row nowrap;
}

.col {
    display: flex;
    flex-flow: column nowrap;
}
</style>
