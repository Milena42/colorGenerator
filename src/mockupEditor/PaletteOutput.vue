<script setup lang="ts">
import { type MockupColors } from '@/generator/common';
import InputColor from '@/inputColor/InputColor.vue';

const colors = defineModel<MockupColors>({ required: true });
</script>

<template>
    <div class="palette">
        <InputColor
            v-model="colors[role]"
            v-for="(color, role) in colors"
            :key="role"
            :role="role"
        />
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
