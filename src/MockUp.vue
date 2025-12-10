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
        '--overlayBg': props.colors.overlay,
        '--accentLarge': props.colors.accentLarge,
        '--accentSmall': props.colors.accentSmall,
        '--text': props.colors.text,
        '--textOnAccent': props.colors.textOnAccent,
    };
});

const card1Colors = computed(() => {
    return {
        '--card': props.colors.card1,
        '--accentLarge': props.colors.accentLarge,
    };
});
const card2Colors = computed(() => {
    return {
        '--card': props.colors.card2,
        '--accentLarge': props.colors.accent2,
    };
});
const card3Colors = computed(() => {
    return {
        '--card': props.colors.card3,
        '--accentLarge': props.colors.accent3,
    };
})

</script>
<template>
    <div class="row">
        <div class="mockup" :style="cssColors">
            <div>
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
            <div class="variants">
                <div class="card" :style="card2Colors">
                    <p>Вариант для сравнения</p>
                    <button>Кнопка</button>
                </div>
                <div class="card" :style="card1Colors">
                    <p>Вариант для сравнения</p>
                    <button>Кнопка</button>
                </div>
                <div class="card" :style="card3Colors">
                    <p>Вариант для сравнения</p>
                    <button>Кнопка</button>
                </div>
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
        background-color: var(--overlayBg);
    }

    button {
        background-color: var(--accentLarge);
        color: var(--textOnAccent);
    }

    a {
        color: var(--accentSmall);
    }

    .card {
        background-color: var(--card);

        button {
            background-color: var(--accentLarge);
        }
    }
}

.mockup {
    --radius: 1rem;
    border-radius: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    gap: 1.5rem;
    padding: 1.8rem 2.2rem;

    font-family: sans-serif;
    font-size: 12pt;

    .overlay {
        border-radius: var(--radius);
        padding: 1.5rem;
    }

    .card {
        border-radius: var(--radius);
        padding: 1.3rem 1rem 1rem;
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        text-align: center;

        gap: 1rem;

        p {
            margin: 0px;
        }
    }

    button {
        padding: 10px 15px;
        border-radius: 0.5rem;
        border: none;
        box-shadow: none;
        font: inherit;
    }

    &>div {
        display: flex;
        flex-flow: row nowrap;
        gap: 1rem;
        align-items: center;
    }
}
</style>