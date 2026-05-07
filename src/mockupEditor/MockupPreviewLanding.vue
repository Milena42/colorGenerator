<script setup lang="ts">
import { getCssColors, type MockupColors } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { computed } from 'vue';

const props = defineProps<{
    colorsLight: MockupColors<ColorRole>;
    colorsDark: MockupColors<ColorRole>;
    theme: 'light' | 'dark' | 'mixed-dark' | 'mixed-light';
}>();

const light = computed(() => getCssColors(props.colorsLight, 'rgbHex'));
const dark = computed(() => getCssColors(props.colorsDark, 'rgbHex'));

const main = computed(() => {
    switch (props.theme) {
        case 'light':
        case 'mixed-light':
            return light.value;
        case 'dark':
        case 'mixed-dark':
        default:
            return dark.value;
    }
});

const second = computed(() => {
    switch (props.theme) {
        case 'dark':
        case 'mixed-light':
            return dark.value;
        case 'light':
        case 'mixed-dark':
        default:
            return light.value;
    }
});

const secondOverlays = computed(() => props.theme == 'dark' || props.theme == 'light');
</script>

<template>
    <div class="mockup" inert>
        <div class="landing-part landing-header" :style="main">
            <div class="landing-logo">
                <div class="logo-circle"></div>
                <p>Лого</p>
            </div>
            <p class="a">Ссылка</p>
            <p class="a">Ссылка</p>
            <p class="a">Ссылка</p>
            <div class="mockup-button">Кнопка</div>
        </div>
        <div class="landing-part" :style="main">
            <div class="landing-block">
                <p class="h">Заголовок</p>
                <p>
                    Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть
                    контрастность. Еще текст, чтобы строки переносились...
                </p>
                <div class="mockup-button">Кнопка</div>
            </div>
            <div class="landing-picture"></div>
        </div>
        <div class="landing-part" :style="second" :class="{ 'landing-second': secondOverlays }">
            <p>
                Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть контрастность.
                Еще текст, чтобы строки переносились...
            </p>
            <div class="mockup-button">Кнопка</div>
        </div>
        <div class="landing-part landing-variants" :style="main">
            <p class="h">Заголовок</p>
            <div>
                <div class="mockup-overlay">
                    <p>
                        Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть
                        контрастность.
                    </p>
                    <div class="mockup-button">Кнопка</div>
                </div>
                <div class="mockup-overlay">
                    <p>
                        Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть
                        контрастность.
                    </p>
                    <div class="mockup-button">Кнопка</div>
                </div>
                <div class="mockup-overlay">
                    <p>
                        Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть
                        контрастность.
                    </p>
                    <div class="mockup-button">Кнопка</div>
                </div>
            </div>
        </div>
        <div class="landing-part landing-second" :style="second">
            <p>
                Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть контрастность.
                Еще текст, чтобы строки переносились...
            </p>
            <div class="mockup-button">Кнопка</div>
        </div>
        <div class="landing-part" :style="second">
            <div class="landing-picture"></div>
            <div class="landing-block">
                <p class="h">Заголовок</p>
                <p>
                    Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть
                    контрастность. Еще текст, чтобы строки переносились...
                </p>
                <div class="mockup-button">Кнопка</div>
            </div>
        </div>
        <div
            class="landing-part landing-footer"
            :style="main"
            :class="{ 'landing-second': secondOverlays }"
        >
            <div>
                <p class="a">Типа ссылка</p>
                <p class="a">Типа ссылка</p>
                <p class="a">Типа ссылка</p>
            </div>
            <div>
                <p class="a">Типа ссылка</p>
                <p class="a">Типа ссылка</p>
                <p class="a">Типа ссылка</p>
            </div>
            <div>
                <p class="a">Типа ссылка</p>
                <p class="a">Типа ссылка</p>
                <p class="a">Типа ссылка</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.mockup {
    margin: 0.5rem;
    width: 50em;

    font-size: 0.4rem;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    border-radius: 1.8em;
    overflow: hidden;

    p {
        margin: 0px;
    }
}

.landing-part {
    padding: 6em 6em 5em;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 4em;

    .landing-block {
        flex: 1 1 0;
        display: flex;
        flex-flow: column nowrap;
        align-items: start;
        gap: 2em;
    }

    .landing-logo {
        display: flex;
        align-items: center;
        font-weight: bold;
        gap: 0.2em;
        color: var(--accentSmall);

        .logo-circle {
            width: 1.5em;
            height: 1.5em;
            border-radius: 50%;
            background-color: var(--accentSmall);
        }
    }

    .landing-picture {
        flex: 1 1 0;
        width: 10em;
        align-self: stretch;
        background-color: var(--overlay);
        border-radius: 0.6em;
    }

    &.landing-header {
        padding-top: 1em;
        padding-bottom: 0.8em;
    }

    &.landing-footer > div {
        flex: 1 1 0;
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        gap: 1em;
    }

    &.landing-variants {
        flex-flow: column nowrap;
        align-items: center;
        gap: 3em;

        > div {
            display: flex;
            flex-flow: row;
            gap: 1em;
        }
    }
}

.h {
    font-size: 2em;
    font-weight: bold;
    margin: 0px;
}

.mockup-top {
    display: flex;
    flex-flow: column nowrap;
    gap: 1em;
}

.mockup-overlay {
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;

    gap: 1em;
    padding: 2em 1.8em 1.5em;
    border-radius: 1.2em;
}

.mockup-icons-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.mockup-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0.5em 1em;
    border-radius: 0.6em;
}

.a {
    text-decoration: underline;
}

.landing-header,
.landing-footer {
    .a {
        text-decoration: none;
    }
}
</style>
