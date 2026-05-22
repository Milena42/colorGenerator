let animatingObjectsCount = 0;
const lockClassName = 'is-animating';

export function lockBodyInteractions() {
    if (animatingObjectsCount <= 0) {
        document.body.classList.add(lockClassName);
        animatingObjectsCount = 0;
    }
    animatingObjectsCount++;
}

export function unlockBodyInteractions() {
    animatingObjectsCount--;
    if (animatingObjectsCount <= 0) {
        document.body.classList.remove(lockClassName);
    }
}
