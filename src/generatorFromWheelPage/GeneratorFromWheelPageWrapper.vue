<script setup lang="ts">
import GeneratorFromWheel from '@/generatorFromWheelPage/GeneratorFromWheelPage.vue';
import { THEME_PARAMS } from '@/injectionKeys';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import { inject } from 'vue';

const themeParams = inject(THEME_PARAMS)!;
</script>

<template>
    <GeneratorFromWheel :themeParams="themeParams" :ColorsOutput="MockupEditor" />
</template>
