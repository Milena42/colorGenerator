<script setup lang="ts">
import { computed } from 'vue';
import PaletteOutput from './PaletteOutput.vue';
import type { MockupColors } from './myTypes';


const props = defineProps<{
    colors: MockupColors,
}>();

const cssColors = computed(() => {
    return {
        '--bg': props.colors.bg,
        '--overlay': props.colors.overlay,
        '--accentLarge': props.colors.accentLarge,
        '--accentSmall': props.colors.accentSmall,
        '--text': props.colors.text,
        '--textOnAccent': props.colors.textOnAccent,
        '--accentLargeOnOverlay': props.colors.accentLargeOnOverlay,
        '--accentSmallOnOverlay': props.colors.accentSmallOnOverlay,
    };
})

</script>
<template>
    <div class="row">
        <div class="mockup" :style="cssColors">
            <div>
                <h2>Заголовок</h2>
                <p>Пример текста. <a href="#">Много текста</a>, чтобы посмотреть контрастность. Еще текст, чтобы строки
                    переносились...</p>
                <button>Кнопка</button>
            </div>

            <div class="overlay">
                <p>Пример текста. <a href="#">Много текста</a>, чтобы посмотреть контрастность. Еще текст, чтобы строки
                    переносились...</p>
                <button>Кнопка</button>
            </div>
        </div>
        <PaletteOutput :colors="colors" />
    </div>
</template>
<style scoped>
.mockup {
    background-color: var(--bg);
    color: var(--text);

    .overlay {
        background-color: var(--overlay);

        button {
            background-color: var(--accentLargeOnOverlay);
        }

        a {
            color: var(--accentSmallOnOverlay)
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
    justify-content: space-between;
    align-items: flex-start;
    gap: 30px;
    padding: 50px;
    width: 300px;
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
</style>