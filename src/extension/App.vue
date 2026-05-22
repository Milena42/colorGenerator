<script setup lang="ts">
import IconTriad from '@/assets/icons/colorSchemes/IconTriad.vue';
import IconDarkTheme from '@/assets/icons/IconDarkTheme.vue';
import IconImage from '@/assets/icons/IconImage.vue';
import IconLightTheme from '@/assets/icons/IconLightTheme.vue';
import IconMenu from '@/assets/icons/IconMenu.vue';
import IconSettings from '@/assets/icons/IconSettings.vue';
import IconTune from '@/assets/icons/IconTune.vue';
import TransitionExpand from '@/assets/TransitionExpand.vue';
import { type ColorFormat, type GenericColorRole, type ThemeParams } from '@/generator/common';
import {
    ALWAYS_SHOW_COLOR_STRINGS,
    COLOR_FORMAT_COPY,
    COLOR_FORMAT_EDIT,
    CONTENT_SCRIPT_CLIENT,
    SHOW_PLOTS,
    SHOW_QUANTITY_ON_PLOTS,
    SHOW_WIREFRAME_ON_PLOTS,
    THEME_PARAMS_USER,
} from '@/injectionKeys';
import { vOnClickOutside } from '@vueuse/components';
import { provide, ref } from 'vue';
import { ContentClient } from './contentClient';

const showQuantityOnPlots = ref(true);
provide(SHOW_QUANTITY_ON_PLOTS, showQuantityOnPlots);

const showWireframeOnPlots = ref(false);
provide(SHOW_WIREFRAME_ON_PLOTS, showWireframeOnPlots);

const showPlots = ref(false);
provide(SHOW_PLOTS, showPlots);

const alwaysShowColorStrings = ref(false);
provide(ALWAYS_SHOW_COLOR_STRINGS, alwaysShowColorStrings);

const colorFormatEdit = ref<ColorFormat>('oklch');
provide(COLOR_FORMAT_EDIT, colorFormatEdit);

const colorFormatCopy = ref<ColorFormat>('rgbHex');
provide(COLOR_FORMAT_COPY, colorFormatCopy);

const themeIsDark = ref(false);

const showSettings = ref(false);
const showMenu = ref(false);

const contentScriptClient = new ContentClient(chrome.devtools.inspectedWindow.tabId);
provide(CONTENT_SCRIPT_CLIENT, contentScriptClient);

const themeParams = ref<ThemeParams<'theme', GenericColorRole>>({
    themeKeys: ['theme'],
    roleKeys: [],
    themes: { theme: {} },
});
provide(THEME_PARAMS_USER, themeParams);
</script>

<template>
    <div class="col app-root" :class="themeIsDark ? 'dark' : 'light'">
        <header class="row">
            <div class="choice-chips">
                <RouterLink class="choice-chip router" activeClass="current" to="/picture">
                    <IconImage /> Из картинки
                </RouterLink>
                <RouterLink class="choice-chip router" activeClass="current" to="/wheel">
                    <IconTriad /> По цветовому кругу
                </RouterLink>
                <RouterLink class="choice-chip router" activeClass="current" to="/theme-params">
                    <IconTune /> Параметры темы
                </RouterLink>
            </div>

            <div class="row">
                <button @click="themeIsDark = !themeIsDark">
                    <IconDarkTheme v-if="!themeIsDark" />
                    <IconLightTheme v-if="themeIsDark" />
                </button>

                <div class="relative settings" v-on-click-outside="() => (showSettings = false)">
                    <button @click="showSettings = !showSettings">
                        <IconSettings />
                    </button>
                    <TransitionExpand>
                        <div v-if="showSettings" class="popup right-0">
                            <div class="row">
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
                            <div class="row">
                                <p>Коды цветов:</p>
                                <div class="choice-chips">
                                    <button
                                        class="choice-chip"
                                        :class="{ current: colorFormatCopy == 'rgbHex' }"
                                        @click="colorFormatCopy = 'rgbHex'"
                                    >
                                        RGB (hex)
                                    </button>
                                    <button
                                        class="choice-chip"
                                        :class="{ current: colorFormatCopy == 'oklch' }"
                                        @click="colorFormatCopy = 'oklch'"
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
                    </TransitionExpand>
                </div>
                <div class="relative" v-on-click-outside="() => (showMenu = false)">
                    <button @click="showMenu = !showMenu">
                        <IconMenu width="24px" height="auto" />
                    </button>
                    <TransitionExpand>
                        <div v-if="showMenu" class="popup right-0">
                            <a
                                href="https://forms.yandex.ru/u/69be9a001f1eb598d3b3d764"
                                referrerpolicy="no-referrer"
                                target="_blank"
                                rel="noopener noreferrer"
                                >Сообщить об ошибке или предложить улучшение</a
                            >
                            <a href="">Как работает генератор</a>
                        </div>
                    </TransitionExpand>
                </div>
            </div>
        </header>
        <RouterView
            class="grow w-full"
            @theme-params-change="(v: ThemeParams<'theme', string>) => (themeParams = v)"
        />
    </div>
</template>

<style scoped>
.app-root {
    padding: var(--adaptive-gap);
    gap: var(--adaptive-gap);

    min-height: 100%;
    width: 100%;

    color: var(--text);
    background-color: var(--background);
}

header {
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--adaptive-gap);

    > div {
        align-items: flex-start;
        gap: calc(var(--adaptive-gap) * 0.7);
    }
}
</style>
