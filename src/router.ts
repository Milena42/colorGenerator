import { createRouter, createWebHistory } from 'vue-router';

const GeneratorFromPicture = () =>
    import('./generatorFromPicturePage/GeneratorFromPicturePage.vue');

const GeneratorFromWheel = () => import('./generatorFromWheelPage/GeneratorFromWheelPage.vue');

const routes = [
    { path: '/', redirect: '/wheel' },
    { path: '/index.html', redirect: '/wheel' },
    { path: '/picture', component: GeneratorFromPicture },
    { path: '/wheel', component: GeneratorFromWheel },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

export default router;
