import { createRouter, createWebHistory } from 'vue-router';

const GeneratorFromPicture = () => import('./GeneratorFromPicturePage.vue');

const GeneratorFromWheel = () => import('./GeneratorFromWheelPage.vue');

const InputTheme = () => import('./InputThemePage.vue');

const routes = [
    { path: '/src/extension/panel.html', redirect: '/theme-params' },
    { path: '/picture', component: GeneratorFromPicture },
    { path: '/wheel', component: GeneratorFromWheel },
    { path: '/theme-params', component: InputTheme },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
