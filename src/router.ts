import { createRouter, createWebHistory } from 'vue-router';

import GeneratorFromPicture from './generatorFromPicturePage/GeneratorFromPicture.vue';
import GeneratorFromWheel from './generatorFromWheelPage/GeneratorFromWheel.vue';
const routes = [
    { path: '/picture', component: GeneratorFromPicture },
    { path: '/wheel', component: GeneratorFromWheel },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
