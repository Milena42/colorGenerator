<script setup lang="ts">
import GeneratorFromPicture from '@/generatorFromPicturePage/GeneratorFromPicture.vue';
import { THEME_PARAMS_USER } from '@/injectionKeys';
import { inject } from 'vue';
import ColorsEditor from './ColorsEditor.vue';

const themeParams = inject(THEME_PARAMS_USER)!;
</script>

<template>
    <GeneratorFromPicture :themeParams="themeParams" :ColorsOutput="ColorsEditor" />
</template>
