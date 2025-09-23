<script setup lang="ts">
import { ref } from 'vue';

/**
 * значение инпута - массив rgbargbargba и количество пикселей
 */
const pixels = defineModel<Uint8ClampedArray>('pixels');
const imageHere = ref(false);
const image = ref();

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
    reader.onload = (e) => {
        image.value = e.target?.result;
    };
    reader.readAsDataURL(file);
}
function loadImgData(e: Event) {
    const img1: HTMLImageElement = e.target as HTMLImageElement;

    ////TODO борьба с зернистостью тут?
    let theWidth: number;
    let theHeight: number;
    const resizeImage = true;
    if (resizeImage) {
        const newSize = img1.naturalWidth * 0.8;
        theWidth = Math.round(newSize);
        theHeight = Math.round(newSize * img1.naturalHeight / img1.naturalWidth);
    } else {
        theWidth = img1.naturalWidth;
        theHeight = img1.naturalHeight;
    }
    ////////////////


    const canvasImg = document.createElement("canvas");
    canvasImg.width = theWidth;
    canvasImg.height = theHeight;

    const ctx = canvasImg.getContext("2d");
    if (!ctx) {
        console.log("no canvas?");
        return;
    }
    ctx.drawImage(img1, 0, 0, theWidth, theHeight);
    let imgData = ctx.getImageData(0, 0, theWidth, theHeight);

    pixels.value = imgData.data; /// одномерный массив rgbargbargba
}

</script>
<template>
    <div class="dropbox" @dragenter="dragenter" @dragover="dragover" @drop="drop">
        <img v-if="imageHere" :src="image" @load="loadImgData" />
        <slot v-else></slot>
    </div>
</template>
<style scoped>
.dropbox {
    min-height: 100px;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: #dadada solid 2px;

    &>* {
        max-height: 100%;
    }

    &:-moz-drag-over {
        /*TODO браузеры*/
        background-color: green;
    }
}
</style>