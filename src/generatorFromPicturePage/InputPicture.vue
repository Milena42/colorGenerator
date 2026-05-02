<script setup lang="ts">
import IconClose from '@/assets/icons/IconClose.vue';
import { type ColorMap } from '@/generator/common';
import { mapFromImage } from '@/generator/loadImage';
import { onMounted, ref } from 'vue';

const imgMap = defineModel<ColorMap | undefined>('imgMap');

const emit = defineEmits<{
    change: [];
    loading: [isLong: boolean];
    stopLoading: [];
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

    const files = e.dataTransfer.files;
    if (files.length < 1) {
        return;
    }
    const file = files.item(0);
    if (file != null) {
        readFile(file);
    }
}

const validationError = ref('');
function showError(message: string) {
    validationError.value = message;
    clear();
}

function readFile(file: File) {
    validationError.value = '';

    if (!file.type.startsWith('image/')) {
        imageError();
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showError('Максимальный размер: 10 МБ');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        if (reader.result == image.value) {
            emit('change');
        } else {
            image.value = reader.result;
            imageHere.value = true;
        }
    };
    reader.onerror = (e) => {
        console.error(reader.error, e);
        showError('Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
}

function imageError() {
    showError('Загрузите изображение, например, .png или .jpg');
}

async function loadImgData(e: Event) {
    const img1: HTMLImageElement = e.target as HTMLImageElement;

    const size = img1.naturalHeight * img1.naturalWidth;
    const isLong = size > 200000;
    emit('loading', isLong);
    await new Promise((r) => setTimeout(r, 50));

    try {
        imgMap.value = await mapFromImage(img1, canvas.value!, ctx.value!);
        emit('change');
    } catch (e) {
        console.error(e);
        showError('Ошибка при чтении файла');
        emit('stopLoading');
    }
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
        <img v-if="imageHere" :src="image" @load="loadImgData" @error="imageError" />
        <div v-else class="input-file">
            <input type="file" id="file" @change="inputFile" accept=".jpg, .jpeg, .png" />
            <label for="file" class="button text-button">Загрузить изображение</label>
            <p class="validation-error">{{ validationError }}</p>
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
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;

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

.validation-error {
    color: var(--error-text);
}
</style>
