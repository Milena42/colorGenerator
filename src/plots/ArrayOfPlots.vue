<script setup lang="ts">
import type { Color } from '@/model/myTypes';
import { defineAsyncComponent } from 'vue';

const ColorModels3d = defineAsyncComponent(() => import('@/plots/ColorModels3d.vue'));

const props = defineProps<{
    maps: Map<string, Color>[] | undefined;
    totalQ: number;
}>();
</script>
<template>
    <div class="row" v-if="maps && maps.length < 6">
        <ColorModels3d v-for="map of props.maps" :k="0.01" :data="map" :totalQ="totalQ" wireframe />
    </div>
    <div v-else-if="maps">Оперативки может не хватить, кол-во графиков: {{ maps.length }}</div>
</template>
