import type { Ref } from 'vue';

export function linear(from: number, to: number, progress: number) {
    return from + (to - from) * progress;
}

export function ease(from: number, to: number, progress: number) {
    return from + (to - from) * progress * progress * (3 - 2 * progress);
}

export function setWithTransition(
    animatedRef: Ref<number>,
    end: number,
    timeTotal: number,
    { circle = false },
) {
    const start = animatedRef.value;

    let endCorrected = end;
    if (circle) {
        let d = (end - start) % 360;
        if (d > 180) d -= 360;
        if (d <= -180) d += 360;
        endCorrected = start + d;
    }

    let timeStart: number;

    function step(timeNow: DOMHighResTimeStamp) {
        if (timeStart == undefined) {
            timeStart = timeNow;
        }

        const progress = (timeNow - timeStart) / timeTotal;

        if (progress >= 1) {
            animatedRef.value = end;
            return;
        }

        const newV = ease(start, endCorrected, progress);

        animatedRef.value = circle ? (newV + 360) % 360 : newV;

        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}
