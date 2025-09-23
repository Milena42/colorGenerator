<script setup lang="ts">
import MapPlot3d from './MapPlot3d.vue';
import type { ColorInMap } from './myTypes';
const props = defineProps<{
    maps: Map<string, ColorInMap>[] | undefined,
    totalQ: number,
}>();

</script>
<template>
    <div class="row" v-if="maps && (maps.length < 6)">
        <MapPlot3d v-for="map of props.maps" :k="500" :data="map" :totalQ="totalQ" />
    </div>
    <div v-else>Оперативки может не хватить</div>
</template>