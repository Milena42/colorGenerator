<script setup lang="ts">
import IconClose from '@/assets/icons/IconClose.vue';
import InputRangeColor from '@/components/inputColor/InputRangeColor.vue';
import type { ColorRoleConstraints, ThemeParams } from '@/generator/common';
import { CONTENT_SCRIPT_CLIENT, THEME_PARAMS_USER } from '@/injectionKeys';
import chroma from 'chroma-js';
import { inject, ref } from 'vue';

const emit = defineEmits<{
    'theme-params-change': [value: ThemeParams<string, string>];
}>();

const themeParams = inject(THEME_PARAMS_USER)!;

function emitChange() {
    //TODO это пока тема только одна, иначе придется поменять
    const theme = themeParams.value.themes[rootSelector.value];

    const themes = Object.create(null);
    themes[rootSelector.value] = theme;

    const params = {
        themeKeys: [rootSelector.value],
        roleKeys: theme ? Object.keys(theme) : [],
        themes: themes,
    };

    console.log('change');
    emit('theme-params-change', params);
}

const contentScriptClient = inject(CONTENT_SCRIPT_CLIENT);

const rootValidationErrors = ref('');
const rootSelector = ref(':root');

async function setRoot(v: string) {
    rootValidationErrors.value = '';
    const status = await contentScriptClient?.call('setRoot', { selector: v });
    if (status == 'ok') {
        rootSelector.value = v;
        emitChange();
    } else {
        rootValidationErrors.value = `Элемент "${v}" не найден`;
    }
}

async function takeVariablesFromPage() {
    if (!contentScriptClient) {
        console.error('inject ContentClient');
        return;
    }

    const variables = await contentScriptClient.call('getCssVariables', undefined);
    console.log(variables);
    const themeRules = Object.fromEntries(
        Object.entries(variables)
            .map(([key, value]): [string, ColorRoleConstraints] => {
                try {
                    const color = chroma(value);
                    let [l, c] = color.oklch();
                    if (!l) l = 0;
                    if (!c) c = 0;
                    l *= 100;
                    c *= 100;
                    const alpha = color.alpha();
                    if (alpha == 1) {
                        return [key, { l, cMax: c }];
                    }
                    return ['', { l: 0, cMax: 0 }];
                } catch {
                    return ['', { l: 0, cMax: 0 }];
                }
            })
            .filter(([key]) => key != ''),
    );
    console.log(themeRules);
    const themes = Object.create(null);
    themes[rootSelector.value] = themeRules;
    themeParams.value = {
        themeKeys: [rootSelector.value],
        roleKeys: Object.keys(themeRules),
        themes: themes,
    };
    emitChange();
}

const showNewVar = ref(false);
const newVar = ref('');
const validationErrors = ref('');

function addNewVar() {
    const name = newVar.value;

    if (name.length == 0) {
        validationErrors.value = 'Заполните название переменной';
        return;
    }
    if (themeParams.value.themes[rootSelector.value][name]) {
        validationErrors.value = 'Переменная с таким названием уже существует';
        return;
    }
    validationErrors.value = '';

    themeParams.value.themes[rootSelector.value][name] = { l: 0, cMax: 0 };
    resetNewVar();
    emitChange();
}

function cancelNewVar() {
    resetNewVar();
}

function resetNewVar() {
    showNewVar.value = false;
    newVar.value = '';
    validationErrors.value = '';
}
</script>
<template>
    <div class="input-theme-page">
        <div class="input-selector">
            <label for="selector">Селектор элемента, на котором переменные:</label>
            <input
                type="text"
                id="selector"
                :value="rootSelector"
                @change="(e) => setRoot((e.target as HTMLInputElement).value)"
            />
            <p class="validation">{{ rootValidationErrors }}</p>
        </div>
        <button @click="takeVariablesFromPage" class="text-button">
            Найти переменные на странице
        </button>
        <div>
            <div :key="key" v-for="(theme, key) in themeParams.themes" class="col">
                <button v-if="!showNewVar" @click="showNewVar = true" class="text-button">
                    Добавить переменную
                </button>
                <div v-if="showNewVar" class="input-theme-new-var">
                    <input type="text" v-model="newVar" />
                    <p class="validation">{{ validationErrors }}</p>
                    <div class="row">
                        <button @click="addNewVar" class="text-button">OK</button>
                        <button @click="cancelNewVar" class="text-button">Отмена</button>
                    </div>
                </div>

                <div :key="role" v-for="(constraints, role) in theme" class="input-theme-role">
                    <button
                        @click="
                            () => {
                                delete theme[role];
                                emitChange();
                            }
                        "
                        title="не генерировать эту переменную"
                    >
                        <IconClose />
                    </button>
                    <p>{{ role }}</p>
                    <div class="col accent-check">
                        <input
                            type="checkbox"
                            v-model="constraints.isAccent"
                            :id="role + 'accent'"
                            @change="emitChange()"
                        />
                        <label :for="role + 'accent'">акцентный</label>
                    </div>
                    <div class="col">
                        <InputRangeColor
                            v-model="constraints.cMax"
                            @change="emitChange()"
                            label="max C"
                            :id="role + 'themeC'"
                            :min="0"
                            :max="40"
                            :gradient="`linear-gradient(to right in oklab, oklch(${69}% 0 ${327}), oklch(${69}% 0.31 ${327}))`"
                        />
                        <InputRangeColor
                            v-model="constraints.l"
                            @change="emitChange()"
                            label="L"
                            :id="role + 'themeL'"
                            :min="0"
                            :max="100"
                            gradient="linear-gradient(to right in oklab, black, white)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.input-theme-role .input-range-color-line {
    label {
        width: 5rem !important;
        text-align: right !important;
    }
}
</style>

<style scoped>
.input-theme-page {
    & > * {
        margin-top: 2rem;
    }
    .input-selector label {
        margin-right: 1rem;
    }
}

.input-theme-role {
    font-family: var(--font-mono);

    display: grid;
    grid-template-columns: auto 15rem auto 25rem;
    grid-template-rows: auto;
    gap: 1rem;
    align-items: center;
    justify-items: stretch;

    width: max-content;

    padding: 1rem;
    border-bottom: 2px solid var(--pale);
}

.input-theme-new-var {
    .row {
        gap: 1rem;
    }
}

.accent-check {
    align-items: center;
    label {
        font-size: 0.7rem;
        color: var(--line);
        font-family: var(--font-default);
    }

    input[type='checkbox']:checked + label {
        color: var(--text);
    }
}

.validation {
    color: var(--error-text);
}
</style>
