<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef, watch, type Ref } from 'vue';
import CircleInput, { circleObject } from './CircleInput.vue';

//import MapPlot3d from './MapPlot3d.vue';
import chroma from 'chroma-js';
import MockUp from './MockUp.vue';
import { hMinus } from './math';
import { Color, accentColorRoles, bgColorRoles, schemeTypes, type MockupColors, type Theme, type schemeType } from './myTypes';
import { maxCAccent, maxCBg, newDarkTheme, newLightTheme } from './themes';

const generatedMap: Ref<Map<string, Color>> = ref<Map<string, Color>>(new Map<string, Color>());



type HFromL = (l: number) => number;
const schemeRulesFromInputs = new Map<schemeType, HFromL>([
    ["mono", (l) => { return inputAccent.h; }],
    ["complementary", (l) => {
        if (35 <= l && l <= 80)
            return inputAccent.h;
        return inputBg.h;
    }],
    ["analog", (l) => {
        return (2 * hMinus(inputSecondary.h, inputAccent.h) * (l - 50) / 100 + inputAccent.h + 360) % 360;
    }],
    ["triad", (l) => {
        if (l < 35) return inputBg.h;
        if (l <= 80) return inputAccent.h;
        return inputSecondary.h;
    }]
]);


const generatedNewLight: MockupColors = reactive({});
const generatedNewDark: MockupColors = reactive({});

const themes: [Theme, MockupColors][] = [
    [newLightTheme, generatedNewLight],
    [newDarkTheme, generatedNewDark],
];


const R_SPECTRAL_CIRCLE = 37;
const inputAccent = reactive(new Color(50, { c: R_SPECTRAL_CIRCLE, h: 0 }));
const inputSecondary = reactive(new Color(50, { c: R_SPECTRAL_CIRCLE, h: 0 }));
const inputBg = reactive(new Color(50, { c: R_SPECTRAL_CIRCLE, h: 0 }));

const typeOfScheme = ref<schemeType>(schemeTypes[0]);

const inputCBg = ref<number>(maxCBg);
const inputCAccent = ref<number>(maxCAccent);

function generateGrayAndAccents() {
    const newGeneratedMap: Map<string, Color> = new Map();
    themes.forEach(([themeRules, generatedTheme]) => {
        accentColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];



            const h = schemeRulesFromInputs.get(typeOfScheme.value)!(l);

            const c = cMax * inputCAccent.value / maxCAccent;

            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
        bgColorRoles.forEach((key) => {
            const { l, cMax } = themeRules[key];


            const h = schemeRulesFromInputs.get(typeOfScheme.value)!(l);


            const c = cMax * inputCBg.value / maxCBg;


            const elem = new Color(l, { c, h });
            const rgbString = elem.adjustForRGB();

            newGeneratedMap.set(rgbString, elem);

            generatedTheme[key] = rgbString;
        });
    });
    return newGeneratedMap;
}

function generate() {
    // цветная - частный случай чб, когда насыщенность максимальна
    generatedMap.value = generateGrayAndAccents();

}

watch([inputAccent, inputBg, inputSecondary], generate);

function changeCBg() {
    if (inputCBg.value > inputCAccent.value) inputCAccent.value = inputCBg.value;
    inputAccent.c = inputCAccent.value;
    generate();
}

function changeCAccent() {
    if (inputCBg.value > inputCAccent.value) inputCBg.value = inputCAccent.value;
    inputAccent.c = inputCAccent.value;
    generate();
}

function changeTypeOfScheme() {
    const accentH = inputAccent.h;
    switch (typeOfScheme.value) {
        case "mono":
            break;
        case "complementary":
            inputBg.h = (accentH + 180) % 360;
            break;
        case "analog":
            inputBg.h = (accentH + 60) % 360;
            inputSecondary.h = (accentH - 60 + 360) % 360;
            break;
        case "triad":
            inputBg.h = (accentH + 120) % 360;
            inputSecondary.h = (accentH - 120 + 360) % 360;
            break;
        default: break;
    }
    bgCircle.calculateCoords();
    secondaryCircle.calculateCoords();
    generate();
}



const svgSquareWidth = 500;

const accentCircle = reactive(new circleObject(inputAccent, svgSquareWidth));
const secondaryCircle = reactive(new circleObject(inputSecondary, svgSquareWidth));
const bgCircle = reactive(new circleObject(inputBg, svgSquareWidth));

let draggedCircle: typeof accentCircle | undefined = undefined;
let startX = 0;
let startY = 0;
let initialCircleX = 0;
let initialCircleY = 0;


function dragstart(element: typeof accentCircle, event: MouseEvent) {
    draggedCircle = element;
    startX = event.clientX;
    startY = event.clientY;
    initialCircleX = draggedCircle.cx;
    initialCircleY = draggedCircle.cy;
};

const hRangeBg = computed<[number, number]>(() => {
    return [(accentCircle.color.h + 120) % 360, (accentCircle.color.h + 120 + 120) % 360];
});//TODO  типа этого проверка вдруг диапазон подходит при переключении селекта

function mousemove(event: MouseEvent) {
    if (!draggedCircle) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    draggedCircle.cx = initialCircleX + deltaX;
    draggedCircle.cy = initialCircleY + deltaY;

    const oldH = draggedCircle.color.h;
    draggedCircle.calculateColorCoords();

    const currentH = draggedCircle.color.h;
    const accentH = accentCircle.color.h;
    if (draggedCircle === accentCircle) {
        const dH = currentH - oldH;
        bgCircle.color.h = (bgCircle.color.h + dH + 360) % 360;
        bgCircle.calculateCoords();
        secondaryCircle.color.h = (secondaryCircle.color.h + dH + 360) % 360;
        secondaryCircle.calculateCoords();
    } else if (draggedCircle === bgCircle) {
        if (typeOfScheme.value == "complementary") {
            draggedCircle.color.h = oldH;
        }
        else {
            secondaryCircle.color.h = (2 * accentH - currentH + 360) % 360;
            secondaryCircle.calculateCoords();
        }
    } else if (draggedCircle === secondaryCircle) {
        bgCircle.color.h = (2 * accentH - currentH + 360) % 360;
        bgCircle.calculateCoords();
    }

    draggedCircle.color.c = R_SPECTRAL_CIRCLE;
    draggedCircle.calculateCoords();
};

function dragend() {
    draggedCircle = undefined;
}

//////////////////////////////////////////////////////////////////////////////
//// рисование фона, TODO выгрузить картинкой на фон и удалить
/////////////////////////////////////////////////////////////////////////////
const canvas = useTemplateRef<HTMLCanvasElement>("drawing");
function drawOklchModel() {
    if (!canvas.value) {
        console.log("canvas отсутствует");
        return;
    }
    const ctx = canvas.value.getContext("2d");
    if (!ctx) {
        console.log("проблемы с контекстом canvas");
        return;
    }
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    const brush = new circleObject(new Color(0, { x: 0, y: 0 }), svgSquareWidth);

    const pixel = 4; // задает гладкость изображения (1 - идеально, но медленно)

    ///////////////////////////////////////////////
    /// спектр

    for (let i = 0; i < svgSquareWidth; i += pixel) {
        for (let j = 0; j < svgSquareWidth; j += pixel) {
            brush.cx = i;
            brush.cy = j;
            brush.calculateColorCoords();
            const r = brush.color.c;
            if (R_SPECTRAL_CIRCLE - 3 <= r && r <= R_SPECTRAL_CIRCLE + 3) {
                const h = brush.color.h;
                const pointToRgb = chroma.oklch(50 / 100, 5 / 100, h);
                if (!pointToRgb.clipped()) {
                    ctx.fillStyle = pointToRgb.set("hsl.s", 1).set("hsl.l", 0.5).hex();
                    ctx.fillRect(i, j, pixel, pixel);
                }
            }
        }
    }

    /////////////////////////////////////////////
    /// меш oklch

    for (let l = 0; l < 100; l += pixel) {
        for (let i = 0; i < svgSquareWidth; i += pixel) {
            for (let j = 0; j < svgSquareWidth; j += pixel) {
                brush.cx = i;
                brush.cy = j;
                brush.calculateColorCoords();
                const c = brush.color.c;
                const h = brush.color.h;
                const pointToRgb = chroma.oklch(l / 100, c / 100, h);
                if (!pointToRgb.clipped()) {
                    ctx.fillStyle = pointToRgb.hex();
                    ctx.fillRect(i, j, pixel, pixel);
                }
            }
        }
    }

}
//////////////////////////////////////////////////////////////////////////

const show2Circles = computed(() => {
    return typeOfScheme.value != "mono";
});
const show3Circles = computed(() => {
    return typeOfScheme.value != "mono" && typeOfScheme.value != "complementary";
})


</script>
<template>
    <div class="row">
        <div>
            <select v-model="typeOfScheme" @change="changeTypeOfScheme">
                <option v-for="t in schemeTypes" :value="t">{{ t }}</option>
            </select>
            <div class="col">
                <label>макс. насыщенность акцента</label>
                <input v-model.number="inputCAccent" @change="changeCAccent" type="range" :min="0" :max="maxCAccent"
                    :step="0.1" :style="{ width: maxCAccent + 'rem' }" list="values" />
                <datalist id="values">
                    <option value="0" label="0"></option>
                    <option value="1" label="1"></option>
                    <option value="5" label="5"></option>
                    <option value="15" label="15"></option>
                </datalist>
                <input v-model.number="inputCBg" @change="changeCBg" type="range" :min="0" :max="maxCBg" :step="0.1"
                    :style="{ width: maxCBg + 'rem' }" list="values" />
                <label>макс. насыщенность фона</label>
            </div>

            <button @click="drawOklchModel">нарисовать фон</button>
            <div class="temp">
                <canvas ref="drawing" :width="svgSquareWidth" :height="svgSquareWidth"></canvas>
                <svg version="1.1" :width="svgSquareWidth" :height="svgSquareWidth" ref="svg"
                    xmlns="http://www.w3.org/2000/svg" style="border:1px solid black" @mousemove="mousemove"
                    @mouseup="dragend" @mouseleave="dragend">
                    <CircleInput :circle-obj="accentCircle" accent @drag-start="(e) => dragstart(accentCircle, e)" />
                    <CircleInput :circle-obj="secondaryCircle" @drag-start="(e) => dragstart(secondaryCircle, e)"
                        v-if="show3Circles" />
                    <CircleInput :circle-obj="bgCircle" @drag-start="(e) => dragstart(bgCircle, e)" v-if="show2Circles" />
                    <circle :r="inputCAccent * svgSquareWidth / 100" :cx="svgSquareWidth / 2" :cy="svgSquareWidth / 2"
                        fill="none" stroke="black" stroke-width="2" />
                    <circle :r="inputCBg * svgSquareWidth / 100" :cx="svgSquareWidth / 2" :cy="svgSquareWidth / 2"
                        fill="none" stroke="black" stroke-width="2" />
                </svg>
            </div>
        </div>

        <div class="m1">
            <!--<MapPlot3d :k="30" :data="generatedMap" :totalQ="generatedMap.size" /> --><!--TODO оно зависает-->
            <div>
                <div style="padding: 2rem;">
                    <MockUp :colorsLight="generatedNewLight" :colorsDark="generatedNewDark" />
                </div>

            </div>
        </div>
    </div>
</template>
<style scoped>
.temp {
    position: relative;

    svg {
        position: absolute;
        top: 0px;
        left: 0px;
    }
}
</style>