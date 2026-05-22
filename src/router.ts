import { createRouter, createWebHistory } from 'vue-router';

const GeneratorFromPicture = () =>
    import('./generatorFromPicturePage/GeneratorFromPicturePageWrapper.vue');

const GeneratorFromWheel = () =>
    import('./generatorFromWheelPage/GeneratorFromWheelPageWrapper.vue');

const routes = [
    { path: '/', redirect: '/wheel' },
    { path: '/picture', component: GeneratorFromPicture },
    { path: '/wheel', component: GeneratorFromWheel },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
