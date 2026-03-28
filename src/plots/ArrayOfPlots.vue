<script setup lang="ts">
import type { Color } from '@/model/myTypes';
import ColorModels3d from './ColorModels3d.vue';
const props = defineProps<{
    maps: Map<string, Color>[] | undefined;
    totalQ: number;
}>();
</script>
<template>
    <div v-if="maps">
        <div class="row" v-if="maps.length < 6">
            <ColorModels3d
                v-for="map of props.maps"
                :k="0.01"
                :data="map"
                :totalQ="totalQ"
                wireframe
            />
        </div>
        <div v-else>Оперативки может не хватить, кол-во графиков: {{ maps.length }}</div>
    </div>
</template>
