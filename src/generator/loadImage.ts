import chroma from 'chroma-js';
import { Color, type ColorMap } from './common';

export async function mapFromImage(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
): Promise<ColorMap> {
    ////////////////////////////////
    // уменьшаем большие картинки: для скорости и борьбы с зернистостью
    // возможна проблема с размыванием векторных покрасов => возвращаясь к проблеме золотого картона
    let theWidth: number;
    let theHeight: number;
    const resizeImage = true;
    if (resizeImage) {
        const maxSize = 1000;
        const maxNatural = Math.max(img.naturalHeight, img.naturalWidth);
        let k = 0.9;
        if (maxNatural > maxSize) {
            k = maxSize / maxNatural;
        }
        theWidth = Math.round(img.naturalWidth * k);
        theHeight = Math.round(img.naturalHeight * k);
    } else {
        theWidth = img.naturalWidth;
        theHeight = img.naturalHeight;
    }
    ////////////////

    canvas.width = theWidth;
    canvas.height = theHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, theWidth, theHeight); // TODO InvalidStateError, TypeMismatchError
    const imgData = ctx.getImageData(0, 0, theWidth, theHeight); // TODO IndexSizeError, SecurityError

    const pixels = imgData.data; /// одномерный массив rgbargbargba

    return await mapFromPixels(pixels);
}

/***
 * @param pixels rgbargbargba array
 */
export async function mapFromPixels(pixels: Uint8ClampedArray<ArrayBuffer>): Promise<ColorMap> {
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
