<script setup lang="ts">
import { vOnClickOutside } from '@vueuse/components';
import { provide, ref } from 'vue';
import IconTriad from './assets/icons/colorSchemes/IconTriad.vue';
import IconDarkTheme from './assets/icons/IconDarkTheme.vue';
import IconImage from './assets/icons/IconImage.vue';
import IconLightTheme from './assets/icons/IconLightTheme.vue';
import IconMenu from './assets/icons/IconMenu.vue';
import IconSettings from './assets/icons/IconSettings.vue';
import type { ColorFormat } from './generator/common';

const showQuantityOnPlots = ref(true);
provide('showQuantityOnPlots', showQuantityOnPlots);

const showWireframeOnPlots = ref(false);
provide('showWireframeOnPlots', showWireframeOnPlots);

const showPlots = ref(false);
provide('showPlots', showPlots);

const alwaysShowColorStrings = ref(false);
provide('alwaysShowColorStrings', alwaysShowColorStrings);

const colorFormatEdit = ref<ColorFormat>('oklch');
provide('colorFormatEdit', colorFormatEdit);

const themeIsDark = ref(false);

const showSettings = ref(false);
const showMenu = ref(false);
</script>

<template>
    <div class="col app-root" :class="themeIsDark ? 'dark' : 'light'">
        <header class="row">
            <div class="relative" v-on-click-outside="() => (showMenu = false)">
                <button @click="showMenu = !showMenu">
                    <IconMenu width="24px" height="auto" />
                </button>
                <div v-if="showMenu" class="popup left-0">
                    <a
                        href="https://forms.yandex.ru/u/69be9a001f1eb598d3b3d764"
                        referrerpolicy="no-referrer"
                        target="_blank"
                        rel="noopener noreferrer"
                        >Сообщить об ошибке или предложить улучшение</a
                    >
                    <a href="">Как работает генератор</a>
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
                        <div class="col">
                            <p>Редактирование цветов:</p>
                            <div class="choice-chips">
                                <button
                                    class="choice-chip"
                                    :class="{ current: colorFormatEdit == 'hsb' }"
                                    @click="colorFormatEdit = 'hsb'"
                                >
                                    HSB
                                </button>
                                <button
                                    class="choice-chip"
                                    :class="{ current: colorFormatEdit == 'oklch' }"
                                    @click="colorFormatEdit = 'oklch'"
                                >
                                    OKLCH
                                </button>
                            </div>
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                v-model="alwaysShowColorStrings"
                                id="alwaysShowColorStrings"
                            />
                            <label for="alwaysShowColorStrings">Показывать коды цветов</label>
                        </div>
                        <div>
                            <input type="checkbox" v-model="showPlots" id="showPlots" />
                            <label for="showPlots">Показывать графики</label>
                        </div>
                        <div v-if="showPlots">
                            <input
                                type="checkbox"
                                v-model="showWireframeOnPlots"
                                id="showWireframeOnPlots"
                            />
                            <label for="showWireframeOnPlots"
                                >Показывать границы цветового пространства на графиках</label
                            >
                        </div>
                        <div v-if="showPlots">
                            <input type="checkbox" v-model="showQuantityOnPlots" id="showQ" />
                            <label for="showQ">Показывать количество на графиках</label>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        <RouterView class="grow w-full" />
    </div>
</template>

<style scoped>
.app-root {
    padding: 1rem;
    gap: 1rem;
    min-height: 100%;
    width: 100%;
    color: var(--text);
    background-color: var(--background);
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
