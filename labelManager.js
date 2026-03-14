import * as THREE from 'three';
import { groupDragObjects } from './wallManager.js';
import { camera2d } from './sceneSetup.js';

// Haetaan kamera main.js tiedostosta
let getActiveCamera = null;

// Annetaan kamera käytettäväksi
export function initLabelManager(cameraGetter) {
    getActiveCamera = cameraGetter;
}

// Luo seinälle HTML tekstikentän seinäryhmään
export function createWallLabel(wallGroup) {
    // Laskee segmentit pituuden laskemiseksi, toimii ainakin vielä, kuin seiniä piirretään puolikkaan ruudun mittaisina
    const seinaPalat = wallGroup.children.filter(c => c.userData.tyyppi === "seina");
    const pituus = (seinaPalat.length * 0.5).toFixed(1);

    // Div-elementti
    const label = document.createElement("div");
    label.className = "wall-label";
    label.textContent = `${pituus} m`;
    document.body.appendChild(label);

    // Pituuselementin allennus myöhempää käyttöä varten
    wallGroup.userData.label = label;
}

// Päivitetään pituuselementin sijainti näytöllä
export function paivitaLabelit() {
    if (!getActiveCamera) return;
    const activeCamera = getActiveCamera();

    groupDragObjects.forEach(wallGroup => {
        const label = wallGroup.userData.label;
        if (!label) return;

        // Piilotetaan pituuselementit 3D:ssö
        if (activeCamera !== camera2d) {
            label.style.display = "none";
            return;
        }

        // Lasketaan seinän keskikohta, siirretään hieman ja projisoidaan pituuselementti seinän alle/viereen
        const seinaPalat = wallGroup.children.filter(c => c.userData.tyyppi === "seina");
        const totalLength = seinaPalat.length * 0.5;
        const midLocal = new THREE.Vector3(0.4, 0, totalLength / 2);

        const midWorld = midLocal.applyMatrix4(wallGroup.matrixWorld);

        const projected = midWorld.clone().project(camera2d);
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

        label.style.display = "block";
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;

        const angle = wallGroup.rotation.y;
        label.style.transform = `translate(-50%, -50%)`;
    });
}