<script setup lang="ts">
import type { Color, MockupColors } from '@/model/myTypes';
import { cartesianFromPolar } from '@/utilities/math';
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
    data: Map<string, Color> | MockupColors;
    totalQ: number;
    hsl?: boolean;
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

        hslPos.push(x, l, -y);
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

function makeGrid() {
    const b = new THREE.PolarGridHelper(0.4, 8, 4, undefined, '#ccc', '#bbb');
    b.translateY(0.5);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
    const a = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#aaa' }));

    scene.add(b, a);
}

function animate() {
    renderer.render(scene, camera);
}

const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
});
const points = new THREE.Points(new THREE.BufferGeometry(), material);

onMounted(() => {
    if (!container.value) return;

    scene = new THREE.Scene();
    scene.background = null;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    container.value.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
        30,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        10,
    );
    camera.position.set(0, 0.5, 2);
    camera.lookAt(0, 0.5, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();

    if (!props.hsl) makeModel();
    makeGrid();

    scene.add(points);

    plotPoints();

    renderer.setAnimationLoop(animate);
});

function plotPoints() {
    if (props.data) {
        const coords: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];

        const data = props.data instanceof Map ? props.data.values() : Object.values(props.data);

        for (const { l, c, h, x, y, q } of data) {
            if (props.hsl) {
                const [h1, s1, l1] = chroma(l / 100, c / 100, h, 'oklch').hsl();
                const [x1, y1] = cartesianFromPolar(s1 * Math.min(1 - l1, l1), h1);
                coords.push(x1, l1, -y1);
            } else coords.push(x / 100, l / 100, -y / 100);
            const [r, g, b] = chroma(l / 100, c / 100, h, 'oklch').rgb();
            colors.push(r / 255, g / 255, b / 255);
            sizes.push(Math.sqrt(props.k * Math.sqrt((100 * q) / props.totalQ)));
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
        geometry.setAttribute('pointColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('scale', new THREE.Float32BufferAttribute(sizes, 1));

        points.geometry = geometry;
    } else {
        points.geometry = new THREE.BufferGeometry();
    }
}

watch(() => props.data, plotPoints, { deep: true });

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
        :style="{ height: `${props.size ?? 500}px`, width: `${props.size ?? 500}px` }"
    ></div>
</template>
