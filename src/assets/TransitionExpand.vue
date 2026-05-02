<script setup lang="ts">
import { onUnmounted } from 'vue';
import { lockBodyInteractions, unlockBodyInteractions } from './animation';

function setMin(el: Element) {
    const e = el as HTMLElement;

    e.style.maxHeight = '0px';
    e.style.maxWidth = '0px';
    e.style.overflow = 'hidden';
}

function setNull(el: Element) {
    const e = el as HTMLElement;

    e.style.maxHeight = '';
    e.style.maxWidth = '';
    e.style.overflow = '';
}

function calcMax(el: Element) {
    return { h: el.scrollHeight + 'px', w: el.scrollWidth + 'px' };
}

function setMax(el: Element, h: string, w: string) {
    const e = el as HTMLElement;

    e.style.maxHeight = h;
    e.style.maxWidth = w;
    e.style.overflow = '';
}
function enter(el: Element, done: () => void) {
    const e = el as HTMLElement;

    setNull(e);
    const { h, w } = calcMax(el);

    setMin(e);

    void e.offsetHeight;

    setMax(el, h, w);

    const onEnd = (event: TransitionEvent) => {
        // Ждем именно самое длинное свойство
        if (event.propertyName === 'max-height') {
            e.removeEventListener('transitionend', onEnd);
            done();
        }
    };
    e.addEventListener('transitionend', onEnd);
}

function leave(el: Element, done: () => void) {
    const e = el as HTMLElement;

    const { h, w } = calcMax(el);
    setMax(el, h, w);

    void e.offsetHeight;

    setMin(el);

    const onEnd = (event: TransitionEvent) => {
        if (event.propertyName === 'max-height') {
            e.removeEventListener('transitionend', onEnd);
            done();
        }
    };
    e.addEventListener('transitionend', onEnd);
}

onUnmounted(() => {
    unlockBodyInteractions();
});
</script>

<template>
    <Transition
        @before-enter="lockBodyInteractions"
        @before-leave="unlockBodyInteractions"
        @enter="enter"
        @leave="leave"
        @after-enter="
            (el) => {
                setNull(el);
                unlockBodyInteractions();
            }
        "
        @after-leave="
            (el) => {
                setNull(el);
                unlockBodyInteractions();
            }
        "
        @enter-cancelled="
            (el) => {
                setNull(el);
                unlockBodyInteractions();
            }
        "
        @leave-cancelled="
            (el) => {
                setNull(el);
                unlockBodyInteractions();
            }
        "
        name="expand"
    >
        <slot></slot>
    </Transition>
</template>

<style>
.expand-enter-from,
.expand-leave-to {
    opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
    opacity: 1;
}
.expand-enter-active {
    transition:
        max-height 0.5s linear,
        max-width 0.5s linear,
        opacity 0.5s linear;

    overflow: hidden;
}
.expand-leave-active {
    transition:
        max-height 0.8s linear,
        max-width 0.8s linear,
        opacity 0.5s linear;

    overflow: hidden;
}

.palette-swap-transition {
    .expand-enter-active {
        transition: max-height 1.5s cubic-bezier(1, 0, 0.87, 0.4);
    }
    .expand-leave-active {
        transition: max-height 1.5s cubic-bezier(0, 1.03, 0.72, 0.65);
    }
}
</style>
