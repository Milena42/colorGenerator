<script setup lang="ts">
import type { Color } from '@/model/myTypes';
import MapPlotPolar from './MapPlotPolar.vue';
const props = defineProps<{
    maps: Map<string, Color>[] | undefined;
    totalQ: number;
}>();
</script>
<template>
    <div v-if="maps">
        <div class="row" v-if="maps.length < 6">
            <MapPlotPolar v-for="map of props.maps" :k="500" :data="map" :totalQ="totalQ" />
        </div>
        <div v-else>Оперативки может не хватить, кол-во графиков: {{ maps.length }}</div>
    </div>
</template>
