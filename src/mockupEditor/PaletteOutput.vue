<script setup lang="ts">
import { type MockupColors } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import InputColor from '@/inputColor/InputColor.vue';
import { vOnClickOutside } from '@vueuse/components';
import { ref } from 'vue';

const colors = defineModel<MockupColors<ColorRole>>({ required: true });

const editingColor = ref<ColorRole | null>(null);
const isSwap = ref(false);

function closeEditing() {
    isSwap.value = false;
    editingColor.value = null;
}

function swapOrOpenEditing(role: ColorRole) {
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
}
</style>
