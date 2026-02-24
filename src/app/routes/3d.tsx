import { useEffect } from "react";
import * as THREE from "three";
import { camera } from "@/lib/3d/camera";
import { createField } from "./field";
import { catanBff } from "@/.server/bff/catan";
import { useLoaderData } from "@/hook/use-data";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Field } from "@/models";

export const loader = async () => {
    const [_, field] = catanBff.createDefaultTemplate(2);
    return { field };
}
export default function Page() {
    const { field } = useLoaderData<typeof loader>();

    useEffect(() => {
        const renderer = scene(field);

        return () => {
            renderer.dispose();
        };
    }, [field]);

    return <></>;
}

function scene(field: Field){
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 100;

    const cam = camera.orthographic(aspect, frustumSize);

    const controls = new OrbitControls(cam, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableZoom = true;

    controls.target.set(0, 0, 0);
    controls.update();

    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    const ambientLight = new THREE.AmbientLight(0x404040);
    light.position.set(-1, 3, 4);
    scene.add(light, ambientLight);

    const axesHelper = new THREE.AxesHelper(10000);
    scene.add(axesHelper);

    createField(field.tiles.map(tile => tile.pos), { scene });

    function animate(){
        controls.update();
        renderer.render(scene, cam);
    }

    renderer.setAnimationLoop(animate);

    return renderer;
}