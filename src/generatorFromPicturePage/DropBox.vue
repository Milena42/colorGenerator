<script setup lang="ts">
import IconClose from '@/assets/icons/IconClose.vue';
import { onMounted, ref } from 'vue';

/**
 * значение инпута - массив rgbargbargba и количество пикселей
 */
const pixels = defineModel<Uint8ClampedArray>('pixels');
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

    ////////////////////////////////
    // уменьшаем большие картинки: для скорости и борьбы с зернистостью
    // возможна проблема с размыванием векторных покрасов => возвращаясь к проблеме золотого картона
    let theWidth: number;
    let theHeight: number;
    const resizeImage = true;
    if (resizeImage) {
        const maxSize = 1000;
        const maxNatural = Math.max(img1.naturalHeight, img1.naturalWidth);
        let k = 0.9;
        if (maxNatural > maxSize) {
            k = maxSize / maxNatural;
        }
        theWidth = Math.round(img1.naturalWidth * k);
        theHeight = Math.round(img1.naturalHeight * k);
    } else {
        theWidth = img1.naturalWidth;
        theHeight = img1.naturalHeight;
    }
    ////////////////

    if (!ctx.value || !canvas.value) {
        console.log('no canvas?');
        return;
    }

    canvas.value.width = theWidth;
    canvas.value.height = theHeight;

    ctx.value.drawImage(img1, 0, 0, theWidth, theHeight); // TODO InvalidStateError, TypeMismatchError
    const imgData = ctx.value.getImageData(0, 0, theWidth, theHeight); // TODO IndexSizeError, SecurityError

    pixels.value = imgData.data; /// одномерный массив rgbargbargba
    emit('change');
}

function clear() {
    imageHere.value = false;
    image.value = '';
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
            Загрузите изображение
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
    border: #dadada solid 2px;

    position: relative;

    button {
        position: absolute;
        top: 0px;
        right: 0px;
    }

    & > * {
        max-height: 100%;
        max-width: 100%;
    }

    &:-moz-drag-over {
        /*TODO браузеры*/
        background-color: green;
    }
}
</style>
