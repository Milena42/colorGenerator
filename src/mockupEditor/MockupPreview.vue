<script setup lang="ts">
import IconHeart from '@/assets/icons/IconHeart.vue';
import IconMenu from '@/assets/icons/IconMenu.vue';
import IconPlus from '@/assets/icons/IconPlus.vue';
import IconStar from '@/assets/icons/IconStar.vue';
import { getCssColors, type MockupColors } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { computed } from 'vue';

const props = defineProps<{
    colors: MockupColors<ColorRole>;
}>();

const cssColors = computed(() => getCssColors(props.colors, 'rgbHex'));
</script>

<template>
    <div class="mockup" :style="cssColors">
        <p class="h">Заголовок</p>
        <div class="mockup-top">
            <p>
                Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть контрастность.
                Еще текст, чтобы строки переносились...
            </p>
            <div class="mockup-icons-row">
                <div class="mockup-button">Кнопка</div>
                <IconHeart class="icon" />
                <IconPlus class="icon" />
                <IconStar class="icon" />
                <IconMenu class="icon" />
            </div>
        </div>
        <div class="mockup-overlay">
            <p>
                Пример текста. <span class="a">Типа ссылка</span>, чтобы посмотреть контрастность.
                Еще текст, чтобы строки переносились...
            </p>
            <div class="mockup-button">Кнопка</div>
        </div>
    </div>
</template>

<style>
.mockup,
.landing-part {
    background-color: var(--bg);
    color: var(--text);
}
.mockup {
    .mockup-overlay,
    .landing-header,
    .landing-second {
        background-color: var(--overlay);

        .mockup-button {
            background-color: var(--accentBright);
            color: var(--bg);
        }
    }

    .mockup-button {
        background-color: var(--accentLarge);
        color: var(--textOnAccent);
    }

    .a {
        color: var(--accentSmall);
    }
    .landing-header,
    .landing-footer {
        .a {
            color: var(--accentBright);
        }
    }

    .icon {
        color: var(--accentBright);
        fill: var(--accentBright);
    }
}
</style>

<style scoped>
.mockup {
    width: 24em;

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    gap: 1.5em;
    padding: 3.6em 2.8em 2.2em;
    border-radius: 1.8em;

    p {
        margin: 0px;
    }
}

.h {
    font-size: 1.6em;
    font-weight: bold;
    margin: 0px;
}

.icon {
    font-size: 2em;
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

.fix-align {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
