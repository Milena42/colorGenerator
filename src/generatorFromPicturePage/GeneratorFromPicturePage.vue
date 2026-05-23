<script setup lang="ts">
import GeneratorFromPicture from '@/generatorFromPicturePage/GeneratorFromPicture.vue';
import { THEME_PARAMS } from '@/injectionKeys';
import MockupEditor from '@/mockupEditor/MockupEditor.vue';
import { inject } from 'vue';

const themeParams = inject(THEME_PARAMS)!;
</script>

<template>
    <GeneratorFromPicture :themeParams="themeParams" :ColorsOutput="MockupEditor" />
</template>
