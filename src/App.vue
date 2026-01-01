<script setup lang="ts">
import chroma from 'chroma-js';
import { computed, provide, ref } from 'vue';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

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
            <div>
                <RouterLink class="tab-button" activeClass="active" to="/picture"
                    >С картинки</RouterLink
                >
                <RouterLink class="tab-button" activeClass="active" to="/wheel"
                    >По кругу</RouterLink
                >
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
<style>
*,
*::before,
*::after {
    box-sizing: border-box;
}

html,
body,
#app {
    margin: 0px;
    padding: 0px;
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

.row {
    display: flex;
    flex-flow: row nowrap;
}

.col {
    display: flex;
    flex-flow: column nowrap;
}

.grow {
    flex-grow: 1;
}

.w-full {
    width: 100%;
}
.tab-button {
    background: rgb(212, 212, 235);
    padding: 0.5rem 2rem;
    border-radius: 1rem;
    text-decoration: none;
    color: inherit;
}
.tab-button.active {
    border: 1px solid red;
}
</style>
