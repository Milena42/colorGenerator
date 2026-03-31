<script setup lang="ts">
import IconClose from '@/assets/icons/IconClose.vue';
import { Color, type ColorMap } from '@/model/myTypes';
import chroma from 'chroma-js';
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

function fillMapFromImg(pixels: Uint8ClampedArray<ArrayBuffer>) {
    /* обрабатываем массив rgbargbargba - по 4 элемента на каждый пиксель */

    const newImgMap: ColorMap = {
        data: new Map(),
        totalQ: pixels.length / 4,
    };

    for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];

        const a = pixels[i + 3];
        if (a != 255) {
            // прозрачные и полупрозрачные пиксели не считаются
            continue;
        }

        // TODO мб убрать, это режет цвета для скорости
        if (r <= 240) r = Math.round(r / 20) * 20;
        else r = 255;
        if (g <= 240) g = Math.round(g / 20) * 20;
        else g = 255;
        if (b <= 240) b = Math.round(b / 20) * 20;
        else b = 255;
        //

        const rgb = chroma(r, g, b, 'rgb');
        const colorString = rgb.hex();

        if (!newImgMap.data.has(colorString)) {
            let [l, c, h] = rgb.oklch();

            if (!l) l = 0;
            if (!c) c = 0;
            if (!h) h = 0;
            // потому что у меня в процентах, а не доля от 1
            l *= 100;
            c *= 100;

            const elem = new Color(l, { c, h }, 1);

            newImgMap.data.set(colorString, elem);
        } else {
            const elem = newImgMap.data.get(colorString)!;
            elem.q += 1;
        }
    }
    return newImgMap;
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

    const pixels = imgData.data; /// одномерный массив rgbargbargba

    imgMap.value = fillMapFromImg(pixels);

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
