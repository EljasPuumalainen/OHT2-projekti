import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const scene = new THREE.Scene();
export const camera3d = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const aspect = window.innerWidth / window.innerHeight;
export const zoom = 10; //Isompi luku = näkyy enemmän aluetta

//TODO:
//*Tätä varmaan pitää vielä säätää, jos muutetaan grid säädettäväksi
export const camera2d = new THREE.OrthographicCamera(
    -zoom * aspect, //Vasen
    zoom * aspect,  //Oikea
    zoom,           //Ylä
    -zoom,          //Ala
    1, 1000
);
camera2d.position.set(0,50,0); //Keskellä 50, asettaa kameran gridin keskelle 100/2=50
camera2d.lookAt(0,0,0);

//TODO:
//*Tätä varmaan pitää vielä säätää, jos muutetaan grid säädettäväksi
camera3d.position.set(10, 10, 10); //Tässä kaikkien täytyy olla > 0, muuten kontrollit menee jumiin, eikä kameraa voi liikuttaa.

export const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x2F2F2F, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

export const controls3D = new OrbitControls(camera3d, renderer.domElement);
controls3D.target.set(0,0,0);
controls3D.maxPolarAngle = Math.PI / 2.5;
controls3D.update()

//2D Kameran liikutus 
//Vasen nappi pohjassa = liikutus
//Rulla zoom
//Oikea nappi kääntö estetty, siirtää vain objekteja
export const controls2D = new OrbitControls(camera2d, renderer.domElement);
controls2D.enableRotate = false;
controls2D.enabled = false;
controls2D.update()

//Valot
//Yleisvalo
export const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight);
//Suuntavalo luo 3D-efektin objektille
export const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

export const gridMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uGridSize: { value: 0.25 },
        uColor: { value: new THREE.Color(0xbbbbbb) },
        uLineWidth: { value: 0.01 },
    },
    vertexShader: `
        varying vec3 vWorldPos;
        void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uGridSize;
        uniform vec3 uColor;
        uniform float uLineWidth;
        varying vec3 vWorldPos;
        void main() {
            vec2 grid = abs(fract(vWorldPos.xz / uGridSize - 0.5) - 0.5) / fwidth(vWorldPos.xz / uGridSize);
            float line = min(grid.x, grid.y);
            float alpha = 1.0 - smoothstep(0.0, 1.5, line);
            gl_FragColor = vec4(uColor, alpha);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide
});

export const hoverMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uGridSize: { value: 0.25 },
        uHoverPos: { value: new THREE.Vector2(-9999, -9999) },
        uHoverActive: { value: false }
    },
    vertexShader: `
        varying vec3 vWorldPos;
        void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uGridSize;
        uniform vec2 uHoverPos;
        uniform bool uHoverActive;
        varying vec3 vWorldPos;
        void main() {
            if (!uHoverActive) discard;
            vec2 ruutu = floor(vWorldPos.xz / uGridSize);
            if (ruutu.x == uHoverPos.x && ruutu.y == uHoverPos.y) {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 0.5);
            } else {
                discard;
            }
        }
    `,
    transparent: true,
    depthTest: false,
    side: THREE.DoubleSide
});

export const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    gridMaterial
);
grid.rotation.x = -Math.PI / 2;
scene.add(grid);

export const hoverMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    hoverMaterial
);
hoverMesh.rotation.x = -Math.PI / 2;
hoverMesh.position.y = 0.01;
hoverMesh.renderOrder = 999;
scene.add(hoverMesh);


export const buttonCamera = document.getElementById("buttonCamera");

export const planeGeo = new THREE.PlaneGeometry(100, 100);
export const planeMat = new THREE.MeshBasicMaterial({ visible: false })
export const drawingPlane = new THREE.Mesh(planeGeo, planeMat);
drawingPlane.rotation.x = -Math.PI / 2;
scene.add(drawingPlane);