<script setup lang="ts">
import { onUnmounted } from 'vue';
import { lockBodyInteractions, unlockBodyInteractions } from './animationLockController';

const props = defineProps<{
    hideContent?: boolean;
}>();

function setMin(el: Element) {
    const e = el as HTMLElement;

    e.style.maxHeight = '0px';
    e.style.maxWidth = '0px';
    e.style.overflow = 'hidden';

    if (props.hideContent) {
        e.classList.add('hide-content');
    }
}

function setNull(el: Element) {
    const e = el as HTMLElement;

    e.style.maxHeight = '';
    e.style.maxWidth = '';
    e.style.overflow = '';

    e.classList.remove('hide-content');
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
        @before-leave="lockBodyInteractions"
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
        max-height 0.55s ease-out,
        max-width 0.5s ease-out,
        opacity 0.5s ease-in;

    overflow: hidden;
}
.expand-leave-active {
    transition:
        max-height 0.55s ease-out,
        max-width 0.5s ease-out,
        opacity 0.3s ease-out;

    overflow: hidden;
}

.palette-swap-transition {
    .expand-enter-active {
        transition:
            max-height 0.5s ease-out,
            opacity 0.45s ease-in-out;
    }
    .expand-leave-active {
        transition:
            max-height 0.45s ease-out,
            opacity 0.4s ease-in-out;
    }
}

.hide-content * {
    opacity: 0;
    transition: opacity 0.05s ease-in-out;
}

.hide-content {
    &.expand-enter-active {
        transition:
            max-height 0.25s ease-out,
            max-width 0.2s ease-out,
            opacity 0.2s ease-in;
    }

    &.expand-leave-active {
        transition:
            max-height 0.2s ease-in,
            max-width 0.15s ease-in,
            opacity 0.15s ease-out;
    }
}
</style>
