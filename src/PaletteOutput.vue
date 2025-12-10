<script setup lang="ts">
import type { MockupColors } from './myTypes';


defineProps<{
    colors: MockupColors,
}>();


</script>
<template>
    <div class="palette">
        <div v-for="color in colors" class="swatch">
            <div :style="{ backgroundColor: color }"></div>
            <p>{{ color }}</p>
        </div>
    </div>
</template>

<style scoped>
.palette {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    gap: 0.2rem;
    padding: 1rem;
}

.swatch {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    div {
        width: 3rem;
        height: 2rem;
    }

    p {
        margin: 0px;
    }
}
</style>