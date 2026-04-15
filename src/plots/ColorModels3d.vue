<script setup lang="ts">
import type { Color, MockupColors } from '@/generator/common';
import { cartesianFromPolar } from '@/utilities/math';
import chroma from 'chroma-js';
import {
    BoxGeometry,
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Line,
    LinearSRGBColorSpace,
    LineBasicMaterial,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Points,
    PolarGridHelper,
    Scene,
    ShaderMaterial,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { inject, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
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
let scene: Scene;
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let mesh: Mesh;
let controls;

const PIXELS = props.wireframe ? 5 : 200;

const showWireframeOnPlots: Ref<boolean> = inject('showWireframeOnPlots') ?? ref(false);
let oklchMesh: Mesh | null;

function makeModel() {
    if (!showWireframeOnPlots.value) {
        if (oklchMesh != null) {
            scene.remove(oklchMesh);
        }
        return;
    }
    //TODO оптимизировать
    const geometry = new BoxGeometry(1, 1, 1, PIXELS, PIXELS, PIXELS);
    const pos = geometry.getAttribute('position');
    const v = new Vector3();
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

    geometry.setAttribute('position', new Float32BufferAttribute(hslPos, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const material = new MeshBasicMaterial({
        vertexColors: true,
        side: DoubleSide,
        wireframe: props.wireframe,
    });

    mesh = new Mesh(geometry, material);
    oklchMesh = mesh;
    scene.add(mesh);
}

function makeGrid() {
    const b = new PolarGridHelper(0.4, 8, 4, undefined, '#ccc', '#bbb');
    b.translateY(0.5);

    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
    const a = new Line(g, new LineBasicMaterial({ color: '#aaa' }));

    scene.add(b, a);
}

function animate() {
    renderer.render(scene, camera);
}

const material = new ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
});
const points = new Points(new BufferGeometry(), material);

onMounted(() => {
    if (!container.value) return;

    scene = new Scene();
    scene.background = null;
    renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.outputColorSpace = LinearSRGBColorSpace;
    container.value.appendChild(renderer.domElement);

    camera = new PerspectiveCamera(
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

const showQuantity: Ref<boolean> = inject('showQuantityOnPlots') ?? ref(true);
const defaultSizeOfPoint = 5;

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
            sizes.push(
                showQuantity.value
                    ? Math.sqrt(props.k * Math.sqrt((100 * q) / props.totalQ))
                    : defaultSizeOfPoint,
            );
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(coords, 3));
        geometry.setAttribute('pointColor', new Float32BufferAttribute(colors, 3));
        geometry.setAttribute('scale', new Float32BufferAttribute(sizes, 1));

        points.geometry = geometry;
    } else {
        points.geometry = new BufferGeometry();
    }
}

watch(() => props.data, plotPoints, { deep: true });
watch(showQuantity, plotPoints, { flush: 'post' });
watch(showWireframeOnPlots, makeModel, { flush: 'post' });

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
        :style="{ height: `${props.size ?? 400}px`, width: `${props.size ?? 400}px` }"
        class="model3D"
    ></div>
</template>
