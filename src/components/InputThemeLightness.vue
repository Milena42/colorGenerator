<script setup lang="ts">
import type { Theme } from '@/generator/common';
import type { ColorRole } from '@/generator/themesExample';
import { onUnmounted, ref, useTemplateRef } from 'vue';

const theme = defineModel<Theme<ColorRole>>({
    required: true,
});

const props = defineProps<{
    themeIsLight?: boolean;
}>();

const MIN_DISTANCE = 5;
const CONTRAST_TEXT = 50;
const CONTRAST_LARGE = 27;

const colorRolesSorted: ColorRole[] = [
    'bg',
    'overlay',
    'accentLarge',
    'accentSmall',
    'accentBright',
    'text',
];

function toNormal(l: number) {
    return props.themeIsLight ? 100 - l : l;
}

function fromNormal(l: number) {
    return props.themeIsLight ? 100 - l : l;
}

type Direction = 'max' | 'min';
function inverse(d: Direction) {
    return d == 'max' ? 'min' : 'max';
}
let blockedDirection: Direction | null = null;

function pushConstraints(direction: Direction) {
    const t = JSON.parse(JSON.stringify(theme.value)) as typeof theme.value;

    for (const key of colorRolesSorted) {
        t[key].l = toNormal(t[key].l);
    }
    if (props.themeIsLight) direction = inverse(direction);

    const n = colorRolesSorted.length;

    function pushToMax() {
        for (let i = 1; i < n; i++) {
            const prev = t[colorRolesSorted[i - 1]].l;
            const current = t[colorRolesSorted[i]].l;

            const currentKey = colorRolesSorted[i];
            let minNormal = 0;
            switch (currentKey) {
                case 'accentLarge':
                    minNormal = t.bg.l + CONTRAST_LARGE;
                    break;

                case 'accentSmall':
                    minNormal = t.overlay.l + CONTRAST_TEXT;
                    break;

                default:
            }
            t[currentKey].l = Math.max(current, prev + MIN_DISTANCE, minNormal);
        }
    }

    function pushToMin() {
        for (let i = n - 2; i >= 0; i--) {
            const prev = t[colorRolesSorted[i + 1]].l;
            const current = t[colorRolesSorted[i]].l;

            const currentKey = colorRolesSorted[i];
            let maxNormal = 100;
            switch (currentKey) {
                case 'bg':
                    maxNormal = t.accentLarge.l - CONTRAST_LARGE;
                    break;

                case 'overlay':
                    maxNormal = t.accentSmall.l - CONTRAST_TEXT;
                    break;

                default:
            }
            t[currentKey].l = Math.min(current, prev - MIN_DISTANCE, maxNormal);
        }
    }

    switch (direction) {
        case 'min': {
            pushToMin();

            if (t[colorRolesSorted[0]].l < 0) {
                t[colorRolesSorted[0]].l = 0;
                pushToMax();
            }
            break;
        }

        case 'max': {
            pushToMax();

            if (t[colorRolesSorted[n - 1]].l > 100) {
                t[colorRolesSorted[n - 1]].l = 100;
                pushToMin();
            }
        }
    }

    for (const key of colorRolesSorted) {
        t[key].l = fromNormal(t[key].l);
    }

    const l = t.accentLarge.l;
    const textL = l > 70 ? 18 : 98;
    t.textOnAccent.l = textL;

    return t;
}

const coordsTrack = useTemplateRef('coordsTrack');
const activeHandle = ref<ColorRole | null>(null);

const containerWidth = ref(0);
function updateContainerWidth() {
    containerWidth.value = coordsTrack.value?.getBoundingClientRect().width ?? 0;
}

function pointerPosition(event: PointerEvent): number {
    if (!coordsTrack.value) return 0;

    const rect = coordsTrack.value.getBoundingClientRect();
    const clientX = event.clientX;

    return clientX - rect.left;
}

function dragStart(event: PointerEvent, key: ColorRole) {
    activeHandle.value = key;
    blockedDirection = null;

    updateContainerWidth();

    document.addEventListener('pointermove', dragMove);
    document.addEventListener('pointerup', dragEnd);
}

function dragMove(event: PointerEvent) {
    if (activeHandle.value == null) return;
    event.preventDefault();

    const position = pointerPosition(event);
    const newValue = Math.max(0, Math.min(100, (position / containerWidth.value) * 100));

    const d = newValue - theme.value[activeHandle.value].l;
    const direction = d > 0 ? 'max' : 'min';
    if (blockedDirection == direction) return;

    theme.value[activeHandle.value].l = newValue;
    let t = pushConstraints(direction);
    const stop = Math.abs(t[activeHandle.value].l - newValue) > 0.001;

    if (stop) {
        blockedDirection = direction;
        theme.value[activeHandle.value].l = t[activeHandle.value].l;
        t = pushConstraints(direction);
    } else {
        blockedDirection = null;
    }
    theme.value = t;
}

function dragEnd() {
    activeHandle.value = null;

    document.removeEventListener('pointermove', dragMove);
    document.removeEventListener('pointerup', dragEnd);
}

onUnmounted(() => {
    document.removeEventListener('pointermove', dragMove);
    document.removeEventListener('pointerup', dragEnd);
});
</script>

<template>
    <div class="slider-labels-wrapper">
        <div class="slider-track-visible input-range-gradient">
            <div ref="coordsTrack" class="slider-track-inner">
                <div
                    v-for="{ l, key } of colorRolesSorted.map((key) => ({ l: theme[key].l, key }))"
                    :key="key"
                    class="slider-handle"
                    :class="{ active: activeHandle == key }"
                    :style="{ left: `${l}%` }"
                    @pointerdown.prevent="(e) => dragStart(e, key)"
                >
                    <div class="slider-handle-label">
                        {{ key }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.slider-labels-wrapper {
    padding: 0.1rem 0px 1rem;
}

.slider-track-visible {
    background-image: linear-gradient(to right in oklch, black, white);
}

.slider-handle:hover {
    z-index: 10;
}

.slider-handle-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    margin-top: 0.3rem;
    padding: 0.1em 0.5em;
    background: var(--pale);
    font-size: 0.8rem;
    border-radius: 0.2rem;
    font-family: var(--font-mono);
}
</style>
