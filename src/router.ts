import { createRouter, createWebHistory } from 'vue-router';

import GeneratorFromPicture from './GeneratorFromPicture.vue';
import GeneratorFromWheel from './GeneratorFromWheel.vue';
const routes = [
    { path: '/picture', component: GeneratorFromPicture },
    { path: '/wheel', component: GeneratorFromWheel },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
