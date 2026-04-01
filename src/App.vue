<script setup lang="ts">
import { vOnClickOutside } from '@vueuse/components';
import chroma from 'chroma-js';
import { computed, provide, ref, watch } from 'vue';
import IconTriad from './assets/icons/colorSchemes/IconTriad.vue';
import IconDarkTheme from './assets/icons/IconDarkTheme.vue';
import IconFeedback from './assets/icons/IconFeedback.vue';
import IconImage from './assets/icons/IconImage.vue';
import IconInfo from './assets/icons/IconInfo.vue';
import IconLightTheme from './assets/icons/IconLightTheme.vue';
import IconMenu from './assets/icons/IconMenu.vue';
import IconSettings from './assets/icons/IconSettings.vue';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

const showWireframeOnPlots = ref(false);
provide('showWireframeOnPlots', showWireframeOnPlots);

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
const showMenu = ref(false);
</script>

<template>
    <div
        class="col page"
        :class="themeIsLight ? 'light' : 'dark'"
        :style="{ '--background': bgColor }"
    >
        <header class="row">
            <div class="relative" v-on-click-outside="() => (showMenu = false)">
                <button @click="showMenu = !showMenu">
                    <IconMenu width="24px" height="auto" />
                </button>
                <div v-if="showMenu" class="popup left-0">
                    <p><IconFeedback />Сообщить об ошибке или предложить улучшение</p>
                    <p><IconInfo />Как работает генератор</p>
                </div>
            </div>

            <div class="choice-chips">
                <RouterLink class="choice-chip router" activeClass="current" to="/picture">
                    <IconImage /> Из картинки
                </RouterLink>
                <RouterLink class="choice-chip router" activeClass="current" to="/wheel">
                    <IconTriad /> По цветовому кругу
                </RouterLink>
            </div>

            <div class="row">
                <button @click="themeIsDark = !themeIsDark">
                    <IconDarkTheme v-if="!themeIsDark" />
                    <IconLightTheme v-if="themeIsDark" />
                </button>

                <div class="relative" v-on-click-outside="() => (showSettings = false)">
                    <button @click="showSettings = !showSettings">
                        <IconSettings />
                    </button>

                    <div v-if="showSettings" class="popup right-0">
                        <div>
                            <input type="checkbox" v-model="showPlots" id="showPlots" />
                            <label for="showPlots">показывать графики</label>
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                v-model="showWireframeOnPlots"
                                id="showWireframeOnPlots"
                            />
                            <label for="showWireframeOnPlots"
                                >показывать границы цветового пространства на графиках</label
                            >
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
    align-items: flex-start;

    > div {
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>
