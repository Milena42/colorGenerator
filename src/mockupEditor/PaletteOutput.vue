<script setup lang="ts" generic="T extends string">
import InputColor from '@/components/inputColor/InputColor.vue';
import { type MockupColors } from '@/generator/common';
import { vOnClickOutside } from '@vueuse/components';
import { ref } from 'vue';

const colors = defineModel<MockupColors<T>>({ required: true });

const editingColor = ref<T | null>(null);
const isSwap = ref(false);

function closeEditing() {
    isSwap.value = false;
    editingColor.value = null;
}

function swapOrOpenEditing(role: T) {
    if (editingColor.value) {
        isSwap.value = true;
    } else {
        isSwap.value = false;
    }
    editingColor.value = role;
}
</script>

<template>
    <div
        class="palette"
        :class="{ 'palette-swap-transition': isSwap }"
        v-on-click-outside="[() => closeEditing(), { ignore: ['.settings'] }]"
    >
        <InputColor
            v-model="colors[role]"
            v-for="(color, role) in colors"
            :key="role"
            :role="role"
            :editing="editingColor == role"
            @close-editing="closeEditing"
            @open-editing="swapOrOpenEditing(role)"
        />
    </div>
</template>

<style scoped>
.palette {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    padding: 1rem;
    align-items: flex-start;
    gap: 1rem;
    white-space: nowrap;
}
</style>
