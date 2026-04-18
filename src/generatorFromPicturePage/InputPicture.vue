<script setup lang="ts">
import IconClose from '@/assets/icons/IconClose.vue';
import { type ColorMap } from '@/generator/common';
import { mapFromImage } from '@/generator/loadImage';
import { onMounted, ref } from 'vue';

const imgMap = defineModel<ColorMap | undefined>('imgMap');

const emit = defineEmits<{
    change: [];
}>();

const imageHere = ref(false);
const image = ref();

const canvas = ref<HTMLCanvasElement>();
const ctx = ref<CanvasRenderingContext2D>();

onMounted(() => {
    canvas.value = document.createElement('canvas');
    ctx.value = canvas.value.getContext('2d') ?? undefined;
});

function dragenter(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!e.dataTransfer) return;
    const file = e.dataTransfer.files[0];
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

function loadImgData(e: Event) {
    const img1: HTMLImageElement = e.target as HTMLImageElement;

    if (!canvas.value || !ctx.value) {
        console.error('canvas not found');
        return;
    }

    imgMap.value = mapFromImage(img1, canvas.value, ctx.value);

    emit('change');
}

function clear() {
    imageHere.value = false;
    image.value = '';
    imgMap.value = undefined;
}

function inputFile() {
    //TODO
}
</script>

<template>
    <div class="dropbox" @dragenter="dragenter" @dragover="dragover" @drop="drop">
        <button v-if="imageHere" @click="clear">
            <IconClose />
        </button>
        <img v-if="imageHere" :src="image" @load="loadImgData" />
        <div v-else class="col">
            <input type="file" @change="inputFile" />
            <p>Загрузите изображение</p>
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
    border-radius: var(--radius);

    position: relative;

    button {
        position: absolute;
        top: 0px;
        right: 0px;
    }

    & > * {
        max-height: 600px;
        max-width: min(100%, 600px);
    }

    &:-moz-drag-over {
        /*TODO браузеры*/
        background-color: green;
    }
}
</style>
