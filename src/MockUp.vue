<script setup lang="ts">
import { computed } from 'vue';
import PaletteOutput from './PaletteOutput.vue';
import type { MockupColors } from './model/myTypes';

const props = defineProps<{
    colorsLight: MockupColors;
    colorsDark: MockupColors;
}>();

const cssColorsDark = computed(() => {
    return {
        '--bg': props.colorsDark.bg,
        '--overlay': props.colorsDark.overlay,
        '--accentLarge': props.colorsDark.accentLarge,
        '--accentSmall': props.colorsDark.accentSmall,
        '--accentOnOverlay': props.colorsDark.accentOnOverlay,
        '--text': props.colorsDark.text,
        '--textOnAccent': props.colorsDark.textOnAccent,
    };
});

const cssColorsLight = computed(() => {
    return {
        '--bg': props.colorsLight.bg,
        '--overlay': props.colorsLight.overlay,
        '--accentLarge': props.colorsLight.accentLarge,
        '--accentSmall': props.colorsLight.accentSmall,
        '--accentOnOverlay': props.colorsLight.accentOnOverlay,
        '--text': props.colorsLight.text,
        '--textOnAccent': props.colorsLight.textOnAccent,
    };
});
</script>
<template>
    <div class="mockups">
        <div class="row">
            <PaletteOutput :colors="colorsDark" />
            <div class="mockup" :style="cssColorsDark">
                <div>
                    <h2>Заголовок</h2>
                    <p>
                        Пример текста. <a href="#">Много текста</a>, чтобы посмотреть контрастность.
                        Еще текст, чтобы строки переносились...
                    </p>
                    <button>Кнопка</button>
                </div>

                <div class="overlay">
                    <p>
                        Пример текста. <a href="#">Много текста</a>, чтобы посмотреть контрастность.
                        Еще текст, чтобы строки переносились...
                    </p>
                    <button>Кнопка</button>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="mockup" :style="cssColorsLight">
                <div>
                    <h2>Заголовок</h2>
                    <p>
                        Пример текста. <a href="#">Много текста</a>, чтобы посмотреть контрастность.
                        Еще текст, чтобы строки переносились...
                    </p>
                    <button>Кнопка</button>
                </div>

                <div class="overlay">
                    <p>
                        Пример текста. <a href="#">Много текста</a>, чтобы посмотреть контрастность.
                        Еще текст, чтобы строки переносились...
                    </p>
                    <button>Кнопка</button>
                </div>
            </div>
            <PaletteOutput :colors="colorsLight" />
        </div>
    </div>
</template>
<style scoped>
.mockup {
    background-color: var(--bg);
    color: var(--text);

    .overlay {
        background-color: var(--overlay);

        button {
            background-color: var(--accentOnOverlay);
        }
    }

    button {
        background-color: var(--accentLarge);
        color: var(--textOnAccent);
    }

    a {
        color: var(--accentSmall);
    }
}

.mockup {
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 30px;
    padding: 50px;
    width: 380px;
    font-family: sans-serif;
    font-size: 12pt;

    .overlay {
        border-radius: 15px;
        padding: 30px;
    }

    button {
        padding: 10px 15px;
        border-radius: 7px;
        border: none;
        box-shadow: none;
        font: inherit;
    }
}

.mockups {
    display: flex;
    flex-flow: row wrap;
    gap: 0px;
    align-items: center;
    justify-content: center;
}
</style>
