<script setup lang="ts">
import type { Color } from '@/model/myTypes';
import chroma from 'chroma-js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import fragmentShader from './shaders/material-frag.glsl?raw';
import vertexShader from './shaders/material-vert.glsl?raw';

const props = defineProps<{
    wireframe?: boolean;
    size?: number; //TODO графики адаптивить?
    k: number;
    data: Map<string, Color>;
    totalQ: number;
}>();

const container = ref<HTMLDivElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let mesh: THREE.Mesh;
let controls;

const PIXELS = props.wireframe ? 5 : 200;

function makeModel() {
    const geometry = new THREE.BoxGeometry(1, 1, 1, PIXELS, PIXELS, PIXELS);
    const pos = geometry.getAttribute('position');
    const v = new THREE.Vector3();
    const colors: number[] = [];
    const hslPos: number[] = [];

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const r = v.x + 0.5;
        const g = v.y + 0.5;
        const b = v.z + 0.5;
        colors.push(r, g, b);

        const [l, x, y] = chroma(r * 255, g * 255, b * 255, 'rgb').oklab();

        hslPos.push(x, l, y);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(hslPos, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        wireframe: props.wireframe,
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function animate() {
    renderer.render(scene, camera);
}

onMounted(() => {
    if (!container.value) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('white');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    container.value.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
        75,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        1000,
    );
    camera.position.set(0.7, 0.5, 0.7);
    camera.lookAt(0, 0.5, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();

    makeModel();

    plotPoints();

    renderer.setAnimationLoop(animate);
});

function plotPoints() {
    //TODO чистить, а то наслаивается при новой картинке
    if (props.data !== undefined) {
        const coords: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];

        props.data.forEach(({ l, c, h, x, y, q }) => {
            coords.push(x / 100, l / 100, y / 100);
            const [r, g, b] = chroma(l / 100, c / 100, h, 'oklch').rgb();
            colors.push(r / 255, g / 255, b / 255);
            sizes.push(Math.sqrt(props.k * Math.sqrt((100 * q) / props.totalQ)));
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
        geometry.setAttribute('pointColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('scale', new THREE.Float32BufferAttribute(sizes, 1));
        console.log(sizes);

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);
    }
}

watch(() => props.data, plotPoints);

const destroy = () => {
    if (renderer) {
        renderer.dispose();
    }
    if (container.value) {
        container.value.innerHTML = '';
    }
};
onUnmounted(destroy);
</script>

<template>
    <div
        ref="container"
        :style="{ height: `${props.size ?? 200}px`, width: `${props.size ?? 200}px` }"
    ></div>
</template>
