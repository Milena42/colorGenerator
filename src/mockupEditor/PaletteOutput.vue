<script setup lang="ts">
import InputColor from '@/inputColor/InputColor.vue';
import { type MockupColors } from '@/model/myTypes';

const colors = defineModel<MockupColors>({ required: true });
</script>

<template>
    <div class="palette">
        <InputColor v-model="colors[role]" v-for="(color, role) in colors" :key="role" />
    </div>
</template>

<style scoped>
.palette {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    padding: 1rem;
}
</style>
