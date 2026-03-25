<script setup lang="ts">
import { vOnClickOutside } from '@vueuse/components';
import chroma from 'chroma-js';
import { computed, provide, ref, watch } from 'vue';
import IconDarkTheme from './assets/icons/IconDarkTheme.vue';
import IconLightTheme from './assets/icons/IconLightTheme.vue';
import IconSettings from './assets/icons/IconSettings.vue';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

const showPlots = ref(false);
provide('showPlots', showPlots);

const alwaysShowColorStrings = ref(false);
provide('alwaysShowColorStrings', alwaysShowColorStrings);

const showLandings = ref(false);
provide('showLandings', showLandings);

const bgColor = ref('#ffffff');
const themeIsLight = computed(() => {
    const c = chroma(bgColor.value);
    const l = c.get('oklch.l');
    return l > 0.5;
});

const themeIsDark = ref(false);
watch(themeIsDark, () => {
    switch (themeIsDark.value) {
        case false:
            bgColor.value = '#ffffff';
            break;
        case true:
            bgColor.value = '#000000';
    }
});

const showSettings = ref(false);
</script>

<template>
    <div
        class="col page"
        :class="themeIsLight ? 'light' : 'dark'"
        :style="{ '--background': bgColor }"
    >
        <header class="row">
            <div>Типа лого тут</div>

            <div class="choice-chips">
                <RouterLink class="choice-chip" activeClass="current" to="/picture"
                    >С картинки</RouterLink
                >
                <RouterLink class="choice-chip" activeClass="current" to="/wheel"
                    >По кругу</RouterLink
                >
            </div>

            <div class="row">
                <button @click="themeIsDark = !themeIsDark">
                    <IconDarkTheme v-if="!themeIsDark" />
                    <IconLightTheme v-if="themeIsDark" />
                </button>

                <div class="settings-container" v-on-click-outside="() => (showSettings = false)">
                    <button @click="showSettings = !showSettings">
                        <IconSettings />
                    </button>

                    <div v-if="showSettings" class="settings">
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
                        <div>
                            <input
                                type="checkbox"
                                v-model="alwaysShowColorStrings"
                                id="alwaysShowColorStrings"
                            />
                            <label for="alwaysShowColorStrings">показывать коды цветов</label>
                        </div>
                        <div>
                            <input type="checkbox" v-model="showLandings" id="showLandings" />
                            <label for="showLandings">показывать примеры лендингов</label>
                        </div>
                    </div>
                </div>
            </div>
        </header>
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
    background-color: var(--background);
}

.page.light {
    --text-color: black;
    --transparent-overlay: rgba(255, 255, 255, 0.5);
}

.page.dark {
    --text-color: white;
    --transparent-overlay: rgba(0, 0, 0, 0.5);
}

header {
    justify-content: space-between;
    align-items: center;

    > div {
        align-items: center;
        gap: 0.5rem;
    }
}

.settings-container {
    position: relative;
}

.settings {
    display: flex;
    flex-flow: column nowrap;
    align-items: start;

    position: absolute;
    right: 0px;
    min-width: max-content;

    background-color: var(--background);
    box-shadow: 1px 1px 1px 1px #000;
    padding: 1rem;
    border-radius: 1rem;
}
</style>
