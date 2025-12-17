<script setup lang="ts">
import { provide, ref } from 'vue';
import GeneratorFromPicture from './GeneratorFromPicture.vue';
import GeneratorFromWheel from './GeneratorFromWheel.vue';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

const enum tabs {
    picture,
    colorWheel,
}
const currentTab = ref(tabs.picture);
</script>

<template>
    <div class="col page">
        <div>
            <input type="checkbox" v-model="showQuantityOnPlots" id="showQ" />
            <label for="showQ">показывать количество на графиках</label>
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
.page {
    padding: 1rem;
    gap: 1rem;
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
