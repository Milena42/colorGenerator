import { crx } from '@crxjs/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import Manifest from './manifest.json';

export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        crx({ manifest: Manifest }),
        {
            name: 'remove-crossorigin',
            transformIndexHtml(html) {
                return html.replace(/crossorigin/g, '');
            },
        },
    ],
    base: './',
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    publicDir: 'public-icons',
    build: {
        cssCodeSplit: false,
        outDir: 'dist-extension',
        rollupOptions: {
            input: {
                devtools: 'src/extension/devtools.html',
                panel: 'src/extension/panel.html',
            },
        },
    },
});
