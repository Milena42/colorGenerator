<script setup lang="ts">
import IconClose from '@/assets/icons/IconClose.vue';
import { type ColorMap } from '@/generator/common';
import { mapFromImage } from '@/generator/loadImage';
import { onMounted, ref } from 'vue';

const imgMap = defineModel<ColorMap | undefined>('imgMap');

const emit = defineEmits<{
    change: [];
    loading: [isLong: boolean];
}>();

const imageHere = ref(false);
const image = ref();

const isDraggingOver = ref(false);

const canvas = ref<HTMLCanvasElement>();
const ctx = ref<CanvasRenderingContext2D>();

onMounted(() => {
    canvas.value = document.createElement('canvas');
    ctx.value = canvas.value.getContext('2d', { willReadFrequently: true }) ?? undefined;
});

function inputFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (files == null) {
        clear();
        return;
    }
    const file = files[0];
    readFile(file);
}

function drop(e: DragEvent) {
    isDraggingOver.value = false;

    if (!e.dataTransfer) return;

    const file = e.dataTransfer.files[0];

    readFile(file);
}

function readFile(file: File) {
    imageHere.value = true;
    const reader = new FileReader();

    reader.onload = () => {
        if (reader.result == image.value) {
            emit('change'); // чтобы было событие загрузки даже если картинка та же
        } else {
            image.value = reader.result;
        }
    };

    reader.onerror = (e) => {
        console.error(reader.error, e);
        alert('ошибка при чтении файла'); //TODO
    };

    reader.readAsDataURL(file);
}

async function loadImgData(e: Event) {
    const img1: HTMLImageElement = e.target as HTMLImageElement;

    const size = img1.naturalHeight * img1.naturalWidth;

    const isLong = size > 200000;
    emit('loading', isLong);
    await new Promise((r) => setTimeout(r, 50));

    if (!canvas.value || !ctx.value) {
        console.error('canvas not found');
        return;
    }

    imgMap.value = await mapFromImage(img1, canvas.value, ctx.value);

    emit('change');
}

function clear() {
    imageHere.value = false;
    image.value = '';
    imgMap.value = undefined;
}
</script>

<template>
    <div
        class="dropbox"
        :class="{ 'drag-over': isDraggingOver }"
        @dragenter.stop.prevent="isDraggingOver = true"
        @dragleave.stop.prevent="isDraggingOver = false"
        @dragover.stop.prevent="isDraggingOver = true"
        @drop.stop.prevent="drop"
    >
        <button v-if="imageHere" @click="clear">
            <IconClose />
        </button>
        <img v-if="imageHere" :src="image" @load="loadImgData" />
        <div v-else class="input-file">
            <input type="file" id="file" @change="inputFile" accept=".jpg, .jpeg, .png" />
            <label for="file" class="button text-button">Загрузите изображение (PNG, JPG)</label>
        </div>
        <div class="drag-over-overlay" v-show="isDraggingOver">
            <p>Перетащите картинку сюда</p>
        </div>
    </div>
</template>

<style scoped>
.dropbox {
    min-height: 100px;
    min-width: 300px;
    max-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--pale);
    border-radius: var(--radius-around);

    position: relative;
    overflow: hidden;
    background-origin: border-box;

    button {
        position: absolute;
        top: 0px;
        right: 0px;
    }

    img {
        max-height: 600px;
        max-width: min(100%, 600px);
    }

    &.drag-over {
        border-color: var(--accent-small);
        background: var(--accent-small);

        * {
            pointer-events: none;
        }
    }

    .drag-over-overlay {
        position: absolute;
        top: 0px;
        bottom: 0px;
        right: 0px;
        left: 0px;

        display: flex;
        align-items: center;
        justify-content: center;

        background: var(--accent-small);
        color: var(--background);
    }
}

.input-file {
    position: relative;

    input[type='file'] {
        opacity: 0;
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }
}
</style>
