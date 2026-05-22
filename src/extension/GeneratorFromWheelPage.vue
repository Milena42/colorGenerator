<script setup lang="ts">
import GeneratorFromWheel from '@/generatorFromWheelPage/GeneratorFromWheelPage.vue';
import { THEME_PARAMS_USER } from '@/injectionKeys';
import { inject } from 'vue';
import ColorsEditor from './ColorsEditor.vue';

const themeParams = inject(THEME_PARAMS_USER)!;
</script>

<template>
    <GeneratorFromWheel :themeParams="themeParams" :ColorsOutput="ColorsEditor" />
</template>
