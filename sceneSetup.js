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

//100 x 100 m grid 1 ruutu = 0.5 metri
export const grid = new THREE.GridHelper(100, 200, 0x666666, 0x666666);
scene.add( grid );

// rendataan päägridit eka, sitten vasta kuva
grid.renderOrder = 0;

export const buttonCamera = document.getElementById("buttonCamera");

export const planeGeo = new THREE.PlaneGeometry(100, 100);
export const planeMat = new THREE.MeshBasicMaterial({ visible: false })
export const drawingPlane = new THREE.Mesh(planeGeo, planeMat);
drawingPlane.rotation.x = -Math.PI / 2;
scene.add(drawingPlane);